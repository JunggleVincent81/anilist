import { graphqlRequest } from './client';

export type AdminSynopsisWorkflow = { id: string; state: string; revision: number };
export type AdminSynopsisQueueItem = {
  id: string; animeId: string; creatorId: string; revision: number; state: string;
  synopsis: string; reason: string | null; createdAt: string; submittedAt: string | null;
};
export type AdminSynopsisQueuePage = { items: AdminSynopsisQueueItem[]; page: number; perPage: number; total: number; hasNextPage: boolean };

const SUBMIT = `mutation SubmitAdminSynopsisDraft($input: SubmitAdminSynopsisInput!) {
  submitAdminSynopsisDraft(input: $input) { id state revision }
}`;
const REVIEW = `mutation ReviewAdminSynopsisSubmission($input: ReviewAdminSynopsisInput!) {
  reviewAdminSynopsisSubmission(input: $input) { id state revision }
}`;
const QUEUE = `query AdminSynopsisReviewQueue($page: Int) {
  adminSynopsisReviewQueue(page: $page) { page perPage total hasNextPage
    items { id animeId creatorId revision state synopsis reason createdAt submittedAt }
  }
}`;
export async function submitAdminSynopsisDraft(input: { draftId: string; expectedRevision: number }) {
  const data = await graphqlRequest<{ submitAdminSynopsisDraft: AdminSynopsisWorkflow }, { input: typeof input }>(SUBMIT, { input });
  return data.submitAdminSynopsisDraft;
}
export async function fetchAdminSynopsisReviewQueue(page: number) {
  const data = await graphqlRequest<{ adminSynopsisReviewQueue: AdminSynopsisQueuePage }, { page: number }>(QUEUE, { page });
  return data.adminSynopsisReviewQueue;
}
export async function reviewAdminSynopsisSubmission(input: { draftId: string; expectedRevision: number; action: 'REQUEST_CHANGES' | 'REJECT'; note: string }) {
  const data = await graphqlRequest<{ reviewAdminSynopsisSubmission: AdminSynopsisWorkflow }, { input: typeof input }>(REVIEW, { input });
  return data.reviewAdminSynopsisSubmission;
}
