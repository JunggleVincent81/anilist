import { graphqlRequest } from './client';

export type AdminStructuredSubject = 'ANIME'|'ANIME_EPISODE'|'MANGA_WORK'|'MANGA_VOLUME'|'MANGA_CHAPTER'|
  'MUSIC_TRACK'|'MUSIC_ARTIST'|'MUSIC_RECORDING'|'MUSIC_RELEASE';
export type StructuredCandidate = {id:string;subjectType:AdminStructuredSubject;sourceName:string;sourceReference:string;
  fieldsJson:string|null;isQuarantined:boolean;editable:boolean;createdAt:string;updatedAt:string};
export type StructuredCandidatePage = {items:StructuredCandidate[];page:number;perPage:number;total:number;hasNextPage:boolean};
export type StructuredDraft = {subjectType:AdminStructuredSubject;sourceName:string;sourceReference:string;fieldsJson:string};
const FIELDS = 'id subjectType sourceName sourceReference fieldsJson isQuarantined editable createdAt updatedAt';
const PAGE = `query AdminStructuredCandidatePage($input:AdminStructuredCandidatePageInput!) {
  adminStructuredCandidatePage(input:$input) { items { ${FIELDS} } page perPage total hasNextPage }
}`;
const CREATE = `mutation CreateAdminStructuredCandidate($input:CreateAdminStructuredCandidateInput!) {
  createAdminStructuredCandidate(input:$input) { ${FIELDS} }
}`;
const UPDATE = `mutation UpdateAdminStructuredCandidate($input:UpdateAdminStructuredCandidateInput!) {
  updateAdminStructuredCandidate(input:$input) { ${FIELDS} }
}`;
export async function fetchStructuredCandidates(input:{subjectType:AdminStructuredSubject;page:number;perPage:number;search?:string;onlyMine?:boolean}) {
  const out=await graphqlRequest<{adminStructuredCandidatePage:StructuredCandidatePage},{input:typeof input}>(PAGE,{input});
  return out.adminStructuredCandidatePage;
}
export async function createStructuredCandidate(input:StructuredDraft) {
  const out=await graphqlRequest<{createAdminStructuredCandidate:StructuredCandidate},{input:StructuredDraft}>(CREATE,{input});
  return out.createAdminStructuredCandidate;
}
export async function updateStructuredCandidate(input:StructuredDraft & {candidateId:string;expectedUpdatedAt:string}) {
  const out=await graphqlRequest<{updateAdminStructuredCandidate:StructuredCandidate},{input:typeof input}>(UPDATE,{input});
  return out.updateAdminStructuredCandidate;
}
