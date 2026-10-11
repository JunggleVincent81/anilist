import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../../../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('P16-W01 admin cross-domain API selects only aggregate fields and no staging payloads', () => {
  const source = read('src/lib/graphql/admin-workspace.ts');
  assert.match(source, /adminWorkspaceOverview/);
  assert.match(source, /manga \{ available works volumes chapters \}/);
  assert.match(source, /editorial \{ available candidates quarantined cases submitted underReview approved \}/);
  assert.doesNotMatch(source, /sourcePayload|normalizedPayload|PUBLISH|catalogStatus/);
});

test('P16-W01 dashboard requires administrator, distinguishes unavailable and is read only', () => {
  const component = read('src/components/admin/admin-workspace-overview.tsx');
  const parent = read('src/components/admin/admin-catalog-dashboard.tsx');
  assert.match(component, /user\?\.role === 'ADMIN'/);
  assert.match(component, /Metrics unavailable/);
  assert.match(component, /Read only/);
  assert.match(parent, /<AdminWorkspaceOverviewPanel refresh=\{refresh\} \/>/);
  assert.doesNotMatch(component, /createAdmin|updateAdmin|mutation|publishAdmin/i);
});
