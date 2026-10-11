import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../../../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
test('P16-W08 GraphQL only previews and stages quarantined imports',()=>{
 const x=read('src/lib/graphql/admin-smart-import.ts');
 assert.match(x,/previewAdminImport\(input:\$input\)/);
 assert.match(x,/applyAdminImport\(input:\$input\)/);
 assert.match(x,/adminImportHistory\(input:\$input\)/);
 assert.doesNotMatch(x,/publishCandidate|approveImport|unquarantine/);
});
test('P16-W08 UI requires ADMIN, explicit review and data limits',()=>{
 const x=read('src/components/admin/admin-smart-import.tsx');
 assert.match(x,/user\?\.role==='ADMIN'/);
 assert.match(x,/confirmApply/);assert.match(x,/file\.size>64\*1024/);
 assert.match(x,/invalidCount===0/);assert.match(x,/getIssues/);
 assert.doesNotMatch(x,/publishRecord|setIsPublished/);
});
test('P16-W08 route noindex and dashboard has navigation',()=>{
 const x=read('src/app/admin/catalog/import/page.tsx');
 assert.match(x,/index:false/);assert.match(x,/AdminSmartImport/);
 assert.match(read('src/components/admin/admin-catalog-dashboard.tsx'),/\/admin\/catalog\/import/);
});
