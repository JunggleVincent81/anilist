import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../../../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
test('P16-W04 GraphQL mutations use variables and only staged candidate endpoints',()=>{
 const s=read('src/lib/graphql/admin-structured-candidates.ts');
 assert.match(s,/createAdminStructuredCandidate\(input:\$input\)/);
 assert.match(s,/updateAdminStructuredCandidate\(input:\$input\)/);
 assert.match(s,/adminStructuredCandidatePage\(input:\$input\)/);
 assert.doesNotMatch(s,/publishAdmin|approveAdmin|commitAnime|isPublished/);
});
test('P16-W04 structured editor lists all nine schema-supported subject types and never exposes publish',()=>{
 const s=read('src/components/admin/admin-structured-editor.tsx');
 for(const x of ['ANIME','ANIME_EPISODE','MANGA_WORK','MANGA_VOLUME','MANGA_CHAPTER','MUSIC_TRACK','MUSIC_ARTIST','MUSIC_RECORDING','MUSIC_RELEASE']){
  assert.match(s,new RegExp('\\b'+x+'\\b'));
 }
 assert.match(s,/user\?\.role==='ADMIN'/);
 assert.match(s,/isQuarantined/);
 assert.doesNotMatch(s,/setIsAdult|setIsPublished|releaseCatalog|publishCandidate/);
});
test('P16-W04 route only presents gated private editor',()=>{
 const s=read('src/app/admin/catalog/editor/page.tsx');
 assert.match(s,/AdminStructuredEditor/);assert.match(s,/index:false/);
});
