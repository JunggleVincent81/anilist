-- CreateEnum
CREATE TYPE "AnimeFormat" AS ENUM ('TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'MUSIC', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AnimeReleaseStatus" AS ENUM ('UPCOMING', 'AIRING', 'FINISHED', 'HIATUS', 'CANCELLED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AnimeSeason" AS ENUM ('WINTER', 'SPRING', 'SUMMER', 'FALL');

-- CreateEnum
CREATE TYPE "AnimeSourceMaterial" AS ENUM ('ORIGINAL', 'MANGA', 'LIGHT_NOVEL', 'NOVEL', 'WEB_NOVEL', 'VISUAL_NOVEL', 'GAME', 'MULTIMEDIA_PROJECT', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AnimeTitleType" AS ENUM ('ROMAJI', 'ENGLISH', 'NATIVE', 'SYNONYM');

-- CreateEnum
CREATE TYPE "AnimeDataProvider" AS ENUM ('MAL', 'ANILIST', 'ANIDB', 'KITSU', 'ANIME_PLANET', 'LIVECHART', 'TMDB', 'IMDB', 'OTHER');

-- CreateTable
CREATE TABLE "Anime" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "titleRomaji" VARCHAR(500),
    "titleEnglish" VARCHAR(500),
    "titleNative" VARCHAR(500),
    "description" TEXT,
    "format" "AnimeFormat" NOT NULL DEFAULT 'UNKNOWN',
    "status" "AnimeReleaseStatus" NOT NULL DEFAULT 'UNKNOWN',
    "sourceMaterial" "AnimeSourceMaterial" NOT NULL DEFAULT 'UNKNOWN',
    "episodes" INTEGER,
    "durationMinutes" INTEGER,
    "season" "AnimeSeason",
    "seasonYear" INTEGER,
    "startDate" DATE,
    "endDate" DATE,
    "coverImageUrl" TEXT,
    "bannerImageUrl" TEXT,
    "isAdult" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Anime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimeTitle" (
    "id" UUID NOT NULL,
    "animeId" UUID NOT NULL,
    "type" "AnimeTitleType" NOT NULL,
    "value" VARCHAR(500) NOT NULL,
    "languageCode" VARCHAR(16),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnimeTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalAnimeId" (
    "id" UUID NOT NULL,
    "animeId" UUID NOT NULL,
    "provider" "AnimeDataProvider" NOT NULL,
    "externalId" VARCHAR(191) NOT NULL,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalAnimeId_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Anime_slug_key" ON "Anime"("slug");

-- CreateIndex
CREATE INDEX "Anime_status_idx" ON "Anime"("status");

-- CreateIndex
CREATE INDEX "Anime_format_idx" ON "Anime"("format");

-- CreateIndex
CREATE INDEX "Anime_seasonYear_season_idx" ON "Anime"("seasonYear", "season");

-- CreateIndex
CREATE INDEX "Anime_startDate_idx" ON "Anime"("startDate");

-- CreateIndex
CREATE INDEX "AnimeTitle_animeId_idx" ON "AnimeTitle"("animeId");

-- CreateIndex
CREATE INDEX "AnimeTitle_animeId_type_idx" ON "AnimeTitle"("animeId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "AnimeTitle_animeId_type_value_key" ON "AnimeTitle"("animeId", "type", "value");

-- CreateIndex
CREATE INDEX "ExternalAnimeId_animeId_idx" ON "ExternalAnimeId"("animeId");

-- CreateIndex
CREATE INDEX "ExternalAnimeId_animeId_provider_idx" ON "ExternalAnimeId"("animeId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalAnimeId_provider_externalId_key" ON "ExternalAnimeId"("provider", "externalId");

-- AddForeignKey
ALTER TABLE "AnimeTitle" ADD CONSTRAINT "AnimeTitle_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalAnimeId" ADD CONSTRAINT "ExternalAnimeId_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Every canonical anime must have at least one non-empty display title.
ALTER TABLE "Anime"
ADD CONSTRAINT "Anime_has_canonical_title_check"
CHECK (
  NULLIF(btrim("titleRomaji"), '') IS NOT NULL
  OR NULLIF(btrim("titleEnglish"), '') IS NOT NULL
  OR NULLIF(btrim("titleNative"), '') IS NOT NULL
);

-- Public anime slugs cannot be empty.
ALTER TABLE "Anime"
ADD CONSTRAINT "Anime_slug_not_empty_check"
CHECK (
  length(btrim("slug")) > 0
);

-- Episodes must be positive when known.
ALTER TABLE "Anime"
ADD CONSTRAINT "Anime_episodes_positive_check"
CHECK (
  "episodes" IS NULL
  OR "episodes" > 0
);

-- Episode duration must be positive when known.
ALTER TABLE "Anime"
ADD CONSTRAINT "Anime_duration_minutes_positive_check"
CHECK (
  "durationMinutes" IS NULL
  OR "durationMinutes" > 0
);

-- Season years must remain within a realistic catalog range.
ALTER TABLE "Anime"
ADD CONSTRAINT "Anime_season_year_range_check"
CHECK (
  "seasonYear" IS NULL
  OR (
    "seasonYear" >= 1900
    AND "seasonYear" <= 2200
  )
);

-- End date cannot precede start date.
ALTER TABLE "Anime"
ADD CONSTRAINT "Anime_date_order_check"
CHECK (
  "startDate" IS NULL
  OR "endDate" IS NULL
  OR "endDate" >= "startDate"
);
