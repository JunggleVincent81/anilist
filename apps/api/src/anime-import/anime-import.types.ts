import type {
  AnimeDataProvider,
  AnimeFormat,
  AnimeReleaseStatus,
  AnimeSeason,
} from '@prisma/client';

import type {
  SourceImageCandidate,
} from './anime-import-image-candidate.js';

type ExternalAnimeIdentity = {
  provider: AnimeDataProvider;
  externalId: string;
  sourceUrl: string;
};

type NormalizedAnimeRecord = {
  title: string;

  format: AnimeFormat;
  status: AnimeReleaseStatus;

  episodes: number | null;
  durationMinutes: number | null;

  season: AnimeSeason | null;
  seasonYear: number | null;

  synonyms: string[];

  tags: string[];
  studios: string[];
  producers: string[];

  // Unlicensed source metadata. Not a displayable Anime cover.
  imageCandidates: SourceImageCandidate[];

  externalIds: ExternalAnimeIdentity[];
  relatedExternalIds: ExternalAnimeIdentity[];
};

type AnimeImportOptions = {
  limit?: number;
  dryRun?: boolean;
  skipRelations?: boolean;
};

type AnimeImportStats = {
  processed: number;
  created: number;
  existing: number;

  relationsCreated: number;
  unresolvedRelations: number;

  startedAt: Date;
  finishedAt: Date | null;
};

export type {
  AnimeImportOptions,
  AnimeImportStats,
  ExternalAnimeIdentity,
  NormalizedAnimeRecord,
};