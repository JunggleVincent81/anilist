import { describe, expect, it } from '@jest/globals';
import { buildSchema, parse, specifiedRules, validate } from 'graphql';
import { graphqlQuerySafetyRule } from './graphql-query-safety.rule.js';

const schema = buildSchema(`
  type Query { tree: Tree!, value: String }
  type Tree { child: Tree, value: String }
`);

function errors(source: string) {
  return validate(schema, parse(source), [...specifiedRules, graphqlQuerySafetyRule]);
}

describe('GraphQL operation safety budgets', () => {
  it('accepts ordinary nested read operations', () => {
    expect(errors('{ tree { child { value } } }')).toHaveLength(0);
  });

  it('rejects excessive nesting', () => {
    const query = '{ tree { ' + 'child { '.repeat(18) + 'value' + ' }'.repeat(18) + ' } }';
    expect(errors(query).some((error) => error.message.includes('depth'))).toBe(true);
  });

  it('rejects excessive aliases before any resolver executes', () => {
    const fields = Array.from({ length: 42 }, (_, i) => `a${i}: value`).join(' ');
    expect(errors(`{ ${fields} }`).some((error) => error.message.includes('aliases'))).toBe(true);
  });

  it('rejects excessively wide selection sets even without aliases', () => {
    const fields = 'value '.repeat(305);
    expect(errors(`{ ${fields} }`).some((error) => error.message.includes('fields'))).toBe(true);
  });

  it('counts fragments each time they are expanded', () => {
    const inner = 'child { '.repeat(9) + 'value' + ' }'.repeat(9);
    const source = `{ tree { ...Deep } } fragment Deep on Tree { ${inner} }`;
    expect(errors(source)).toHaveLength(0);
    const deeper = `{ tree { child { ...Deeper } } } fragment Deeper on Tree { ${'child { '.repeat(18)}value${' }'.repeat(18)} }`;
    expect(errors(deeper).some((error) => error.message.includes('depth'))).toBe(true);
  });

  it('counts reused fragment fields rather than treating fragments as free', () => {
    const spread = Array.from({ length: 35 }, () => '...Repeat').join(' ');
    const source = `{ tree { ${spread} } } fragment Repeat on Tree { ${'value '.repeat(10)} }`;
    expect(errors(source).some((error) => error.message.includes('fields'))).toBe(true);
  });
});
