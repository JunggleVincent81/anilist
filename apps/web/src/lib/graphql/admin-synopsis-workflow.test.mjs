import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../../../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
test('AN-145 GraphQL operations are typed and never request approval', () => {
  const source = read('src/lib/graphql/admin-synopsis-workflow.ts');
  assert.match(source, /submitAdminSynopsisDraft\(input: \$input\)/);
  assert.match(source, /reviewAdminSynopsisSubmission\(input: \$input\)/);
  assert.match(source, /adminSynopsisReviewQueue\(page: \$page\)/);
  assert.doesNotMatch(source, /APPROVE|PUBLISH/);
});
test('AN-145 review queue is gated and separate from publication', () => {
  const component = read('src/components/admin/admin-synopsis-review-queue.tsx');
  assert.match(component, /user\?\.role === 'ADMIN'/);
  assert.match(component, /item\.creatorId === currentUserId/);
  assert.match(component, /REQUEST_CHANGES/);
  assert.match(component, /REJECT/);
});
test('AN-145 synopsis submit requires a saved unmodified revision', () => {
  const component = read('src/components/admin/admin-synopsis-editor.tsx');
  assert.match(component, /draft\.revision/);
  assert.match(component, /synopsis\.trim\(\) !== draft\.synopsis/);
});
