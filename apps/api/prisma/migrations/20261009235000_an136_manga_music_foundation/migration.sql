-- AN-136 additive schema only. REQUIRES approval before application. No seed/backfill.
CREATE TYPE "AnimeMusicCategory" AS ENUM ('OPENING', 'ENDING', 'SOUNDTRACK', 'INSERT_SONG', 'OTHER');
CREATE TABLE "MangaWork" (
 "id" UUID NOT NULL, "slug" VARCHAR(220) NOT NULL, "title" VARCHAR(500) NOT NULL,
 "synopsis" TEXT, "sourceName" VARCHAR(150) NOT NULL, "sourceReference" VARCHAR(500) NOT NULL,
 "isAdult" BOOLEAN, "isPublished" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "MangaWork_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MangaWork_slug_key" ON "MangaWork"("slug");
CREATE INDEX "MangaWork_isPublished_isAdult_title_idx" ON "MangaWork"("isPublished", "isAdult", "title");
CREATE TABLE "AnimeMusicTrack" (
 "id" UUID NOT NULL, "slug" VARCHAR(220) NOT NULL, "title" VARCHAR(500) NOT NULL,
 "artistName" VARCHAR(250) NOT NULL, "category" "AnimeMusicCategory" NOT NULL,
 "animeId" UUID, "sourceName" VARCHAR(150) NOT NULL, "sourceReference" VARCHAR(500) NOT NULL,
 "isPublished" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "AnimeMusicTrack_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AnimeMusicTrack_slug_key" ON "AnimeMusicTrack"("slug");
CREATE INDEX "AnimeMusicTrack_isPublished_category_title_idx" ON "AnimeMusicTrack"("isPublished", "category", "title");
CREATE INDEX "AnimeMusicTrack_animeId_idx" ON "AnimeMusicTrack"("animeId");
ALTER TABLE "AnimeMusicTrack" ADD CONSTRAINT "AnimeMusicTrack_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
