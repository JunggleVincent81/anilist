import { graphqlRequest } from './client';

export type AdminDomainKind = 'MANGA_WORK' | 'MANGA_VOLUME' | 'MANGA_CHAPTER' |
  'MUSIC_TRACK' | 'MUSIC_ARTIST' | 'MUSIC_RECORDING' | 'MUSIC_RELEASE' |
  'MUSIC_RELEASE_TRACK' | 'MUSIC_CREDIT';
export type AdminPublicationFilter = 'ALL' | 'PRIVATE' | 'PUBLISHED';
export type AdminDomainRecord = {
  id: string; title: string; subtitle: string | null; sourceName: string | null;
  sourceReference: string | null; relatedId: string | null;
  isPublished: boolean; isAdult: boolean | null; createdAt: string;
};
export type AdminDomainRecordPage = {
  domain: AdminDomainKind; available: boolean; items: AdminDomainRecord[];
  page: number; perPage: number; total: number | null; hasNextPage: boolean;
};
export type AdminDomainPageInput = {
  domain: AdminDomainKind; page?: number; perPage?: number;
  search?: string; publication?: AdminPublicationFilter;
};
const QUERY = `query AdminDomainRecordPage($input: AdminDomainPageInput!) {
  adminDomainRecordPage(input: $input) {
    domain available page perPage total hasNextPage
    items { id title subtitle sourceName sourceReference relatedId isPublished isAdult createdAt }
  }
}`;
export async function fetchAdminDomainRecords(input: AdminDomainPageInput): Promise<AdminDomainRecordPage> {
  const response = await graphqlRequest<{adminDomainRecordPage: AdminDomainRecordPage}, {input:AdminDomainPageInput}>(QUERY, {input});
  return response.adminDomainRecordPage;
}
