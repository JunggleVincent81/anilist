import { graphqlRequest } from './client';
export type Dossier = {id:string;sourceUrl:string;publisher:string;rightsBasis:string;licenseLabel:string|null;
  attribution:string|null;expiresAt:string|null;revokedAt:string|null;isQuarantined:boolean;createdAt:string};
export type MediaIntake = {id:string;animeId:string;sourceDossierId:string;kind:'COVER'|'BANNER';sha256:string;
  mime:string;byteLength:number;width:number;height:number;copyrightOwner:string;isQuarantined:boolean;createdAt:string};
export type Page<T> = {items:T[];page:number;perPage:number;total:number|null;hasNextPage:boolean;available:boolean};
export type SourceInput = {sourceUrl:string;publisher:string;rightsBasis:string;licenseLabel?:string;attribution?:string;expiresAt?:string};
export type MediaInput = {animeId:string;sourceDossierId:string;kind:'COVER'|'BANNER';sha256:string;mime:string;
  byteLength:number;width:number;height:number;copyrightOwner:string};
const DOSSIER_FIELDS='id sourceUrl publisher rightsBasis licenseLabel attribution expiresAt revokedAt isQuarantined createdAt';
const MEDIA_FIELDS='id animeId sourceDossierId kind sha256 mime byteLength width height copyrightOwner isQuarantined createdAt';
const SRC_PAGE=`query AdminSourceDossiers($input:AdminMediaEvidencePageInput){adminSourceDossiers(input:$input){available page perPage total hasNextPage items{${DOSSIER_FIELDS}}}}`;
const MEDIA_PAGE=`query AdminMediaIntakes($input:AdminMediaEvidencePageInput){adminMediaIntakes(input:$input){available page perPage total hasNextPage items{${MEDIA_FIELDS}}}}`;
const SRC_CREATE=`mutation CreateAdminSourceDossier($input:CreateAdminSourceDossierInput!){createAdminSourceDossier(input:$input){${DOSSIER_FIELDS}}}`;
const SRC_REVOKE=`mutation RevokeAdminSourceDossier($id:ID!){revokeAdminSourceDossier(id:$id){${DOSSIER_FIELDS}}}`;
const MEDIA_CREATE=`mutation CreateAdminMediaIntake($input:CreateAdminMediaIntakeInput!){createAdminMediaIntake(input:$input){${MEDIA_FIELDS}}}`;
export type Filter={page:number;perPage:number;onlyMine:boolean};
export async function fetchSourceDossiers(input:Filter){const x=await graphqlRequest<{adminSourceDossiers:Page<Dossier>},{input:Filter}>(SRC_PAGE,{input});return x.adminSourceDossiers;}
export async function fetchMediaIntakes(input:Filter){const x=await graphqlRequest<{adminMediaIntakes:Page<MediaIntake>},{input:Filter}>(MEDIA_PAGE,{input});return x.adminMediaIntakes;}
export async function createSourceDossier(input:SourceInput){const x=await graphqlRequest<{createAdminSourceDossier:Dossier},{input:SourceInput}>(SRC_CREATE,{input});return x.createAdminSourceDossier;}
export async function revokeSourceDossier(id:string){const x=await graphqlRequest<{revokeAdminSourceDossier:Dossier},{id:string}>(SRC_REVOKE,{id});return x.revokeAdminSourceDossier;}
export async function createMediaIntake(input:MediaInput){const x=await graphqlRequest<{createAdminMediaIntake:MediaIntake},{input:MediaInput}>(MEDIA_CREATE,{input});return x.createAdminMediaIntake;}
