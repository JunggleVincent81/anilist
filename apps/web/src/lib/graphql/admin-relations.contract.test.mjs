import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../../../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
test('P16-W05 typed relation mutations are private proposals and never canonical publishing',()=>{
 const source=read('src/lib/graphql/admin-relations.ts');
 assert.match(source,/createAdminRelationProposal\(input:\$input\)/);
 assert.match(source,/adminRelationCanonicalPage\(input:\$input\)/);
 assert.match(source,/adminRelationProposalPage\(input:\$input\)/);
 assert.doesNotMatch(source,/publishRelation|approveRelation|deleteCanonical/);
});
test('P16-W05 private editor gates ADMIN and handles missing migration',()=>{
 const source=read('src/components/admin/admin-relation-manager.tsx');
 assert.match(source,/user\?\.role==='ADMIN'/);
 assert.match(source,/onlyMine/);
 assert.match(source,/canonical\?\.available===false/);
 assert.match(source,/proposals\?\.available===false/);
 assert.match(source,/ANIME_EPISODE/);
 assert.doesNotMatch(source,/setIsPublished|publishRecord|unquarantine/);
});
test('P16-W05 route is non-indexed and links from dashboard',()=>{
 const route=read('src/app/admin/catalog/relations/page.tsx');
 const dash=read('src/components/admin/admin-catalog-dashboard.tsx');
 assert.match(route,/index: false/);
 assert.match(route,/AdminRelationManager/);
 assert.match(dash,/\/admin\/catalog\/relations/);
});
