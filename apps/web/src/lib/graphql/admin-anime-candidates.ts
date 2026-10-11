import { graphqlRequest } from './client';

export type AdminAnimeCandidate = {
  id: string; sourceName: string; sourceReference: string; synopsis: string | null;
  isQuarantined: boolean; editable: boolean; createdAt: string; updatedAt: string;
};
export type AdminAnimeCandidatePage = { items: AdminAnimeCandidate[]; page: number; perPage: number;
  total: number; hasNextPage: boolean };
export type AnimeCandidateDraft = { sourceName: string; sourceReference: string; synopsis: string };

const FIELDS = 'id sourceName sourceReference synopsis isQuarantined editable createdAt updatedAt';
const PAGE = `query AdminAnimeCandidatePage($input: AdminAnimeCandidatePageInput) {
  adminAnimeCandidatePage(input: $input) { items { ${FIELDS} } page perPage total hasNextPage }
}`;
const CREATE = `mutation CreateAdminAnimeCandidate($input: CreateAdminAnimeCandidateInput!) {
  createAdminAnimeCandidate(input: $input) { ${FIELDS} }
}`;
const UPDATE = `mutation UpdateAdminAnimeCandidate($input: UpdateAdminAnimeCandidateInput!) {
  updateAdminAnimeCandidate(input: $input) { ${FIELDS} }
}`;

export async function fetchAdminAnimeCandidates(input: { page: number; perPage: number; search?: string; onlyMine?: boolean }) {
  const response = await graphqlRequest<{ adminAnimeCandidatePage: AdminAnimeCandidatePage }, { input: typeof input }>(PAGE, { input });
  return response.adminAnimeCandidatePage;
}
export async function createAdminAnimeCandidate(input: AnimeCandidateDraft) {
  const response = await graphqlRequest<{ createAdminAnimeCandidate: AdminAnimeCandidate }, { input: AnimeCandidateDraft }>(CREATE, { input });
  return response.createAdminAnimeCandidate;
}
export async function updateAdminAnimeCandidate(input: AnimeCandidateDraft & { candidateId: string; expectedUpdatedAt: string }) {
  const response = await graphqlRequest<{ updateAdminAnimeCandidate: AdminAnimeCandidate }, { input: typeof input }>(UPDATE, { input });
  return response.updateAdminAnimeCandidate;
}
