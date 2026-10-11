import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../../../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

test('P16-W02 admin candidate GraphQL operations are private and do not authorize publish', () => {
  const s = read('src/lib/graphql/admin-anime-candidates.ts');
  assert.match(s, /adminAnimeCandidatePage\(input: \$input\)/);
  assert.match(s, /createAdminAnimeCandidate\(input: \$input\)/);
  assert.match(s, /updateAdminAnimeCandidate\(input: \$input\)/);
  assert.doesNotMatch(s, /PUBLISH|UNQUARANTINE|isAdult|catalogStatus|sourcePayload/);
});
test('P16-W02 separated canonical read and quarantined draft editor are ADMIN gated', () => {
  const s = read('src/components/admin/admin-anime-manager.tsx');
  assert.match(s, /user\?\.role === 'ADMIN'/);
  assert.match(s, /fetchAdminCatalogPage/);
  assert.match(s, /fetchAdminAnimeCandidates/);
  assert.match(s, /expectedUpdatedAt:editing\.updatedAt/);
  assert.match(s, /Legacy synopsis draft/);
  assert.match(s, /Quarantined/);
});
