import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../../../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
test('P16-W07 GraphQL supports only guarded review and audit (never approve/publish)',()=>{
 const s=read('src/lib/graphql/admin-editorial-review.ts');
 assert.match(s,/createAdminEditorialCase\(input:\$input\)/);
 assert.match(s,/transitionAdminEditorialCase\(input:\$input\)/);
 assert.match(s,/adminEditorialCaseDetail\(id:\$id\)/);
 assert.doesNotMatch(s,/approveEditorialCase|publishEditorialCase|commitCanonical|unquarantine/);
});
test('P16-W07 UI is ADMIN gated and explicit about blocked canonical writes',()=>{
 const s=read('src/components/admin/admin-editorial-review.tsx');
 assert.match(s,/user\?\.role==='ADMIN'/);
 assert.match(s,/Commit readiness: BLOCKED/);
 assert.match(s,/independent reviewer/);
 assert.match(s,/Append-only transition history/);
 assert.doesNotMatch(s,/approveEditorialCase|publishEditorialCase|setIsPublished/);
});
test('P16-W07 route noindexed and navigation linked',()=>{
 const route=read('src/app/admin/catalog/editorial/page.tsx');
 const dash=read('src/components/admin/admin-catalog-dashboard.tsx');
 assert.match(route,/index:false/);
 assert.match(dash,/\/admin\/catalog\/editorial/);
});
