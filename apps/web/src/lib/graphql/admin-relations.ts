import { graphqlRequest } from './client';

export type AdminRelationKind = 'ANIME_MANGA'|'ANIME_MUSIC_USAGE'|'ANIME_EPISODE'|'MUSIC_RELEASE_TRACK'|
 'MUSIC_CREDIT_TRACK'|'MUSIC_CREDIT_RECORDING'|'MUSIC_CREDIT_RELEASE'|'MUSIC_CREDIT_RELEASE_TRACK';
export type AdminRelationInput = {kind:AdminRelationKind;sourceId:string;targetId:string;relationKey:string;
 detailsJson:string;sourceName:string;sourceReference:string};
export type AdminRelationProposal = AdminRelationInput & {id:string;isQuarantined:boolean;createdAt:string};
export type AdminRelationEdge = {id:string;sourceId:string;targetId:string;relationKey:string;isPublished:boolean|null;createdAt:string};
export type AdminRelationPage<T> = {items:T[];page:number;perPage:number;total:number|null;hasNextPage:boolean;available:boolean};
export type AdminRelationPageInput = {kind:AdminRelationKind;page:number;perPage:number;onlyMine?:boolean};
const CANONICAL=`query AdminRelationCanonicalPage($input:AdminRelationPageInput!) {
 adminRelationCanonicalPage(input:$input){page perPage total hasNextPage available items{id sourceId targetId relationKey isPublished createdAt}}
}`;
const PROPOSALS=`query AdminRelationProposalPage($input:AdminRelationPageInput!) {
 adminRelationProposalPage(input:$input){page perPage total hasNextPage available items{id kind sourceId targetId relationKey detailsJson sourceName sourceReference isQuarantined createdAt}}
}`;
const CREATE=`mutation CreateAdminRelationProposal($input:CreateAdminRelationProposalInput!) {
 createAdminRelationProposal(input:$input){id kind sourceId targetId relationKey detailsJson sourceName sourceReference isQuarantined createdAt}
}`;
export async function fetchAdminCanonicalRelations(input:AdminRelationPageInput) {
 const value=await graphqlRequest<{adminRelationCanonicalPage:AdminRelationPage<AdminRelationEdge>},{input:AdminRelationPageInput}>(CANONICAL,{input});
 return value.adminRelationCanonicalPage;
}
export async function fetchAdminRelationProposals(input:AdminRelationPageInput) {
 const value=await graphqlRequest<{adminRelationProposalPage:AdminRelationPage<AdminRelationProposal>},{input:AdminRelationPageInput}>(PROPOSALS,{input});
 return value.adminRelationProposalPage;
}
export async function createAdminRelationProposal(input:AdminRelationInput) {
 const value=await graphqlRequest<{createAdminRelationProposal:AdminRelationProposal},{input:AdminRelationInput}>(CREATE,{input});
 return value.createAdminRelationProposal;
}
