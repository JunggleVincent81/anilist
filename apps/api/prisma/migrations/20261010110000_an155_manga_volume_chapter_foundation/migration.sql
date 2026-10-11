-- AN-155 Manga Volume and Chapter Foundation
-- Approved scope: additive migration SQL preparation only.
-- No seed, data migration, chapter import, or backfill.
-- Do not deploy to development without separate approval.

CREATE TYPE "MangaChapterType" AS ENUM (
    'REGULAR',
    'SPECIAL',
    'OTHER'
);

CREATE TABLE "MangaVolume" (
    "id" UUID NOT NULL,
    "mangaWorkId" UUID NOT NULL,

    "volumeKey" VARCHAR(180) NOT NULL,
    "number" INTEGER,
    "title" VARCHAR(500),
    "releaseDate" DATE,
    "sourceReference" TEXT,

    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MangaVolume_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "MangaVolume_number_positive_chk"
        CHECK ("number" > 0)
);

CREATE TABLE "MangaChapter" (
    "id" UUID NOT NULL,
    "mangaWorkId" UUID NOT NULL,

    "volumeId" UUID,

    "chapterKey" VARCHAR(180) NOT NULL,
    "chapterType" "MangaChapterType" NOT NULL DEFAULT 'REGULAR',
    "number" DECIMAL(12,3),

    "title" VARCHAR(500),
    "releaseDate" DATE,
    "sourceReference" TEXT,

    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MangaChapter_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "MangaChapter_number_nonnegative_chk"
        CHECK ("number" >= 0)
);

-- Stable volume identity inside each manga work.

CREATE UNIQUE INDEX
    "MangaVolume_mangaWorkId_volumeKey_key"
ON "MangaVolume"("mangaWorkId", "volumeKey");

-- Required for the composite chapter-to-volume FK.

CREATE UNIQUE INDEX
    "MangaVolume_id_mangaWorkId_key"
ON "MangaVolume"("id", "mangaWorkId");

CREATE INDEX
    "MangaVolume_mangaWorkId_number_idx"
ON "MangaVolume"("mangaWorkId", "number");

-- Stable chapter identity inside each manga work.

CREATE UNIQUE INDEX
    "MangaChapter_mangaWorkId_chapterKey_key"
ON "MangaChapter"("mangaWorkId", "chapterKey");

CREATE INDEX
    "MangaChapter_mangaWorkId_chapterType_number_idx"
ON "MangaChapter"(
    "mangaWorkId",
    "chapterType",
    "number"
);

CREATE INDEX
    "MangaChapter_volumeId_mangaWorkId_idx"
ON "MangaChapter"("volumeId", "mangaWorkId");

-- A volume belongs to exactly one MangaWork.

ALTER TABLE "MangaVolume"
ADD CONSTRAINT "MangaVolume_mangaWorkId_fkey"
FOREIGN KEY ("mangaWorkId")
REFERENCES "MangaWork"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- A chapter belongs to exactly one MangaWork.

ALTER TABLE "MangaChapter"
ADD CONSTRAINT "MangaChapter_mangaWorkId_fkey"
FOREIGN KEY ("mangaWorkId")
REFERENCES "MangaWork"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Optional volume, but it must belong to the same MangaWork.
-- PostgreSQL's default MATCH SIMPLE permits a NULL volumeId.

ALTER TABLE "MangaChapter"
ADD CONSTRAINT "MangaChapter_volumeId_mangaWorkId_fkey"
FOREIGN KEY ("volumeId", "mangaWorkId")
REFERENCES "MangaVolume"("id", "mangaWorkId")
ON DELETE RESTRICT
ON UPDATE CASCADE;
