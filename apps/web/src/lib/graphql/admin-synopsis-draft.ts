import { graphqlRequest } from './client';

export type AdminSynopsisDraft = {
  id: string;
  animeId: string;
  revision: number;
  synopsis: string;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
};

const DRAFT_FIELDS = 'id animeId revision synopsis reason createdAt updatedAt';
const CREATE = `mutation CreateAdminSynopsisDraft($input: CreateAdminSynopsisDraftInput!) {
  createAdminSynopsisDraft(input: $input) { ${DRAFT_FIELDS} }
}`;
const LOAD = `query AdminSynopsisDraft($draftId: String!) {
  adminSynopsisDraft(draftId: $draftId) { ${DRAFT_FIELDS} }
}`;
const UPDATE = `mutation UpdateAdminSynopsisDraft($input: UpdateAdminSynopsisDraftInput!) {
  updateAdminSynopsisDraft(input: $input) { ${DRAFT_FIELDS} }
}`;

export async function createAdminSynopsisDraft(input: { animeId: string; synopsis: string; reason?: string }): Promise<AdminSynopsisDraft> {
  const data = await graphqlRequest<{ createAdminSynopsisDraft: AdminSynopsisDraft }, { input: typeof input }>(CREATE, { input });
  return data.createAdminSynopsisDraft;
}
export async function loadAdminSynopsisDraft(draftId: string): Promise<AdminSynopsisDraft> {
  const data = await graphqlRequest<{ adminSynopsisDraft: AdminSynopsisDraft }, { draftId: string }>(LOAD, { draftId });
  return data.adminSynopsisDraft;
}
export async function updateAdminSynopsisDraft(input: { draftId: string; expectedRevision: number; synopsis: string; reason?: string }): Promise<AdminSynopsisDraft> {
  const data = await graphqlRequest<{ updateAdminSynopsisDraft: AdminSynopsisDraft }, { input: typeof input }>(UPDATE, { input });
  return data.updateAdminSynopsisDraft;
}
