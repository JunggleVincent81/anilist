import {
  AnimeDataProvider,
} from '@prisma/client';

const CANONICAL_IDENTITY_PROVIDERS =
  new Set<AnimeDataProvider>([
    AnimeDataProvider.MAL,
    AnimeDataProvider.ANILIST,
    AnimeDataProvider.ANIDB,
    AnimeDataProvider.KITSU,
    AnimeDataProvider.ANIME_PLANET,
    AnimeDataProvider.LIVECHART,
    AnimeDataProvider.ANN,
  ]);

function canMergeByExternalIdentity(
  provider: AnimeDataProvider,
): boolean {
  return (
    CANONICAL_IDENTITY_PROVIDERS
      .has(provider)
  );
}

export {
  CANONICAL_IDENTITY_PROVIDERS,
  canMergeByExternalIdentity,
};