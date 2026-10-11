import { describe, expect, it } from '@jest/globals';
import { candidateEvidenceDigest, strictSynopsis } from './private-synopsis-integrity.js';
const candidate = {
  id: 'ab8e846b-27fc-4871-80ce-e7f4030bd0ea',
  subjectType: 'ANIME', sourceName: 'Curator', sourceReference: 'reference-1',
  sourcePayload: { z: 2, nested: { b: 'two', a: 'one' } },
  normalizedPayload: { synopsis: 'A curated synopsis.' },
};
describe('AN-165/166 candidate provenance hashing', () => {
  it('is stable across key ordering of original JSON', () => {
    const same = { ...candidate, sourcePayload: { nested: { a: 'one', b: 'two' }, z: 2 } };
    expect(candidateEvidenceDigest(candidate)).toBe(candidateEvidenceDigest(same));
  });
  it('changes on source identity, original source data and synopsis text', () => {
    for (const change of [ { sourceReference: 'other' },
      { sourcePayload: { z: 3 } }, { normalizedPayload: { synopsis: 'Modified' } } ]) {
      expect(candidateEvidenceDigest({ ...candidate, ...change })).not.toBe(candidateEvidenceDigest(candidate));
    }
  });
  it('rejects non-synopsis proposals, invisible control text and malformed source', () => {
    for (const payload of [{ synopsis: 'good', isAdult: false }, { description: 'bad' },
      { synopsis: ' \u0000 ' }, { synopsis: '  ' }, null]) {
      expect(() => strictSynopsis(payload)).toThrow();
    }
    expect(() => candidateEvidenceDigest({ ...candidate, subjectType: 'MANGA_WORK' })).toThrow();
  });
});
