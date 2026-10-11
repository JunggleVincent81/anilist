import { graphqlRequest } from './client';

export type AdminWorkspaceMangaMetrics = {
  available: boolean; works: number | null; volumes: number | null; chapters: number | null;
};
export type AdminWorkspaceMusicMetrics = {
  available: boolean; tracks: number | null; artists: number | null;
  recordings: number | null; releases: number | null; credits: number | null;
};
export type AdminWorkspaceEditorialMetrics = {
  available: boolean; candidates: number | null; quarantined: number | null;
  cases: number | null; submitted: number | null; underReview: number | null; approved: number | null;
};
export type AdminWorkspaceOverview = {
  manga: AdminWorkspaceMangaMetrics;
  music: AdminWorkspaceMusicMetrics;
  editorial: AdminWorkspaceEditorialMetrics;
};

const WORKSPACE_QUERY = `query AdminWorkspaceOverview {
  adminWorkspaceOverview {
    manga { available works volumes chapters }
    music { available tracks artists recordings releases credits }
    editorial { available candidates quarantined cases submitted underReview approved }
  }
}`;

export async function fetchAdminWorkspaceOverview(): Promise<AdminWorkspaceOverview> {
  const result = await graphqlRequest<{ adminWorkspaceOverview: AdminWorkspaceOverview }>(WORKSPACE_QUERY);
  return result.adminWorkspaceOverview;
}
