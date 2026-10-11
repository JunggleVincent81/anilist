import { graphqlRequest } from './client';
export type AdminImportSubject='ANIME'|'ANIME_EPISODE'|'MANGA_WORK'|'MANGA_VOLUME'|'MANGA_CHAPTER'|'MUSIC_TRACK'|'MUSIC_RECORDING'|'MUSIC_RELEASE'|'MUSIC_ARTIST';
export type ImportBatch={id:string;subjectType:AdminImportSubject;fileName:string;fileSha256:string;format:string;
  sourceName:string;sourceReference:string;status:'PREVIEWED'|'APPLIED';rowCount:number;validCount:number;
  invalidCount:number;createdCount:number;skippedCount:number;issuesJson:string;createdAt:string;appliedAt:string|null};
export type ImportPage={items:ImportBatch[];page:number;perPage:number;total:number|null;hasNextPage:boolean;available:boolean};
const FIELDS='id subjectType fileName fileSha256 format sourceName sourceReference status rowCount validCount invalidCount createdCount skippedCount issuesJson createdAt appliedAt';
const PREVIEW=`mutation PreviewAdminImport($input:PreviewAdminImportInput!){previewAdminImport(input:$input){${FIELDS}}}`;
const APPLY=`mutation ApplyAdminImport($input:ApplyAdminImportInput!){applyAdminImport(input:$input){${FIELDS}}}`;
const HISTORY=`query AdminImportHistory($input:AdminImportHistoryInput){adminImportHistory(input:$input){available page perPage total hasNextPage items{${FIELDS}}}}`;
export async function previewAdminImport(input:{subjectType:AdminImportSubject;fileName:string;base64:string;sourceName:string;sourceReference:string}){
  const x=await graphqlRequest<{previewAdminImport:ImportBatch},{input:typeof input}>(PREVIEW,{input});return x.previewAdminImport;
}
export async function applyAdminImport(input:{batchId:string;expectedFileSha256:string}){
  const x=await graphqlRequest<{applyAdminImport:ImportBatch},{input:typeof input}>(APPLY,{input});return x.applyAdminImport;
}
export async function fetchAdminImportHistory(input:{page:number;perPage:number}){
  const x=await graphqlRequest<{adminImportHistory:ImportPage},{input:typeof input}>(HISTORY,{input});return x.adminImportHistory;
}
