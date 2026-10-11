import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../../../', import.meta.url);
const read = p => readFileSync(new URL(p,root),'utf8');
test('P16-W03 canonical Manga and Music inventories are read-only and typed',()=>{
  const source=read('src/lib/graphql/admin-domain-records.ts');
  assert.match(source,/adminDomainRecordPage\(input: \$input\)/);
  assert.match(source,/MANGA_WORK/);
  assert.match(source,/MUSIC_CREDIT/);
  assert.doesNotMatch(source,/\bmutation\b|publishAdmin|approveAdmin|unquarantine/i);
});
test('P16-W03 private manager enforces ADMIN and unavailable states',()=>{
  const source=read('src/components/admin/admin-domain-manager.tsx');
  assert.match(source,/user\?\.role === 'ADMIN'/);
  assert.match(source,/!data\.available/);
  assert.match(source,/No zero-record assumption/);
  assert.match(source,/fetchAdminDomainRecords/);
  assert.doesNotMatch(source,/createAdmin|updateAdmin|deleteAdmin/);
});
test('P16-W03 adds both private routes with distinct domain selectors',()=>{
  assert.match(read('src/app/admin/catalog/manga/page.tsx'),/kind="MANGA"/);
  assert.match(read('src/app/admin/catalog/music/page.tsx'),/kind="MUSIC"/);
});
