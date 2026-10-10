-- AN-154 Anime Episode Foundation
-- Approval B: additive migration SQL preparation.
-- No data migration, seed, or episode backfill.

CREATE TYPE "AnimeEpisodeType" AS ENUM (
    'REGULAR',
    'SPECIAL',
    'OTHER'
);

CREATE TABLE "AnimeEpisode" (
    "id" UUID NOT NULL,
    "animeId" UUID NOT NULL,
    "episodeKey" VARCHAR(180) NOT NULL,
    "episodeType" "AnimeEpisodeType" NOT NULL DEFAULT 'REGULAR',
    "number" INTEGER,
    "title" VARCHAR(500),
    "durationMinutes" INTEGER,
    "airDate" DATE,
    "sourceReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnimeEpisode_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "AnimeEpisode_number_positive_chk"
        CHECK ("number" > 0),

    CONSTRAINT "AnimeEpisode_duration_positive_chk"
        CHECK ("durationMinutes" > 0)
);

CREATE UNIQUE INDEX
    "AnimeEpisode_animeId_episodeKey_key"
ON "AnimeEpisode"("animeId", "episodeKey");

CREATE INDEX
    "AnimeEpisode_animeId_episodeType_number_idx"
ON "AnimeEpisode"(
    "animeId",
    "episodeType",
    "number"
);

ALTER TABLE "AnimeEpisode"
ADD CONSTRAINT "AnimeEpisode_animeId_fkey"
FOREIGN KEY ("animeId")
REFERENCES "Anime"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
