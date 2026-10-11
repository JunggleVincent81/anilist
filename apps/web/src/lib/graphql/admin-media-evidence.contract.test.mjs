import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../../../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
test('P16-W06 private source and media GraphQL operations never approve or upload bytes',()=>{
  const src=read('src/lib/graphql/admin-media-evidence.ts');
  for(const op of ['adminSourceDossiers','adminMediaIntakes','createAdminSourceDossier','revokeAdminSourceDossier','createAdminMediaIntake'])assert.match(src,new RegExp(op));
  assert.doesNotMatch(src,/publishAsset|approveAsset|unquarantine|uploadBytes|storageKey/);
});
test('P16-W06 frontend remains ADMIN-only and displays rights uncertainty and missing-table states',()=>{
  const src=read('src/components/admin/admin-media-evidence.tsx');
  assert.match(src,/user\?\.role==='ADMIN'/);
  assert.match(src,/available===false/);
  assert.match(src,/rights claim/i);
  assert.match(src,/revokeSourceDossier/);
  assert.doesNotMatch(src,/setIsPublished|markApproved|releaseAsset/);
});
test('P16-W06 route is private noindex and linked in admin navigation',()=>{
  assert.match(read('src/app/admin/catalog/evidence/page.tsx'),/index:false/);
  assert.match(read('src/components/admin/admin-catalog-dashboard.tsx'),/\/admin\/catalog\/evidence/);
});
