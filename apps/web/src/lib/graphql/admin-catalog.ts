import { graphqlRequest } from './client';

export type AdminCatalogStatus = 'INCLUDED' | 'REVIEW' | 'EXCLUDED';
export type AdminCatalogAge = 'UNKNOWN' | 'ADULT' | 'NON_ADULT';
export type AdminCatalogOverview = {
  total: number;
  included: number;
  review: number;
  excluded: number;
  unverifiedAge: number;
  emptySynopsis: number;
  missingCover: number;
  curationRequests: number;
};
export type AdminCatalogAnime = {
  id: string;
  slug: string;
  title: string;
  format: string;
  catalogStatus: AdminCatalogStatus;
  seasonYear: number | null;
  isAdult: boolean | null;
  hasSynopsis: boolean;
  hasCover: boolean;
  synopsisPreview: string | null;
};
export type AdminCatalogResult = {
  items: AdminCatalogAnime[];
  pageInfo: { page: number; perPage: number; total: number; pageCount: number; hasNextPage: boolean; hasPreviousPage: boolean };
};
export type AdminCatalogFilter = {
  page: number;
  perPage: number;
  search?: string;
  status?: AdminCatalogStatus;
  age?: AdminCatalogAge;
};

const OVERVIEW_QUERY = `query AdminCatalogOverview {
  adminCatalogOverview { total included review excluded unverifiedAge emptySynopsis missingCover curationRequests }
}`;
const PAGE_QUERY = `query AdminCatalogPage($input: AdminCatalogPageInput) {
  adminCatalogPage(input: $input) {
    items { id slug title format catalogStatus seasonYear isAdult hasSynopsis hasCover synopsisPreview }
    pageInfo { page perPage total pageCount hasNextPage hasPreviousPage }
  }
}`;

export async function fetchAdminCatalogOverview(): Promise<AdminCatalogOverview> {
  const payload = await graphqlRequest<{ adminCatalogOverview: AdminCatalogOverview }>(OVERVIEW_QUERY);
  return payload.adminCatalogOverview;
}
export async function fetchAdminCatalogPage(input: AdminCatalogFilter): Promise<AdminCatalogResult> {
  const payload = await graphqlRequest<{ adminCatalogPage: AdminCatalogResult }, { input: AdminCatalogFilter }>(PAGE_QUERY, { input });
  return payload.adminCatalogPage;
}
