import {graphqlRequest} from './client';
export type EditorialCase={id:string;candidateId:string;canonicalEntityId:string|null;subjectType:string;
  state:string;revision:number;openedById:string|null;candidateLabel:string;sourceName:string;createdAt:string;updatedAt:string};
export type EditorialPage={items:EditorialCase[];page:number;perPage:number;total:number|null;hasNextPage:boolean;available:boolean};
export type EditorialHistory={id:string;actorId:string;action:string;fromState:string;toState:string;
  previousRevision:number;nextRevision:number;note:string|null;createdAt:string};
export type EditorialDetail=EditorialCase&{sourceReference:string;proposedJson:string|null;
  canonicalBeforeJson:string|null;comparisonStatus:string;history:EditorialHistory[];commitReady:boolean;blockers:string[]};
export type EditorialTransition='SUBMIT'|'BEGIN_REVIEW'|'REQUEST_CHANGES'|'REJECT';
const CASE_FIELDS='id candidateId canonicalEntityId subjectType state revision openedById candidateLabel sourceName createdAt updatedAt';
const LIST=`query AdminEditorialCases($input:AdminEditorialPageInput){adminEditorialCases(input:$input){available total page perPage hasNextPage items{${CASE_FIELDS}}}}`;
const DETAIL=`query AdminEditorialCaseDetail($id:ID!){adminEditorialCaseDetail(id:$id){${CASE_FIELDS} sourceReference proposedJson canonicalBeforeJson comparisonStatus commitReady blockers history{id actorId action fromState toState previousRevision nextRevision note createdAt}}}`;
const CREATE=`mutation CreateAdminEditorialCase($input:CreateAdminEditorialCaseInput!){createAdminEditorialCase(input:$input){${CASE_FIELDS}}}`;
const TRANSITION=`mutation TransitionAdminEditorialCase($input:TransitionAdminEditorialCaseInput!){transitionAdminEditorialCase(input:$input){${CASE_FIELDS}}}`;
export async function fetchEditorialCases(input:{page:number;perPage:number;onlyMine:boolean;state?:string}){
  const x=await graphqlRequest<{adminEditorialCases:EditorialPage},{input:typeof input}>(LIST,{input});return x.adminEditorialCases;
}
export async function fetchEditorialCaseDetail(id:string){const x=await graphqlRequest<{adminEditorialCaseDetail:EditorialDetail},{id:string}>(DETAIL,{id});return x.adminEditorialCaseDetail;}
export async function createEditorialCase(input:{candidateId:string;canonicalEntityId?:string}){
  const x=await graphqlRequest<{createAdminEditorialCase:EditorialCase},{input:typeof input}>(CREATE,{input});return x.createAdminEditorialCase;
}
export async function transitionEditorialCase(input:{caseId:string;expectedRevision:number;action:EditorialTransition;note?:string}){
  const x=await graphqlRequest<{transitionAdminEditorialCase:EditorialCase},{input:typeof input}>(TRANSITION,{input});return x.transitionAdminEditorialCase;
}
