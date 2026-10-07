-- CreateEnum
CREATE TYPE "AnimeListStatus" AS ENUM ('PLANNING', 'WATCHING', 'COMPLETED', 'PAUSED', 'DROPPED', 'REWATCHING');

-- CreateTable
CREATE TABLE "AnimeListEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "animeId" UUID NOT NULL,
    "status" "AnimeListStatus" NOT NULL DEFAULT 'PLANNING',
    "progressEpisodes" INTEGER NOT NULL DEFAULT 0,
    "score" DECIMAL(3,1),
    "rewatchCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnimeListEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnimeListEntry_animeId_idx" ON "AnimeListEntry"("animeId");

-- CreateIndex
CREATE INDEX "AnimeListEntry_userId_status_updatedAt_idx" ON "AnimeListEntry"("userId", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnimeListEntry_userId_animeId_key" ON "AnimeListEntry"("userId", "animeId");

-- AddForeignKey
ALTER TABLE "AnimeListEntry" ADD CONSTRAINT "AnimeListEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeListEntry" ADD CONSTRAINT "AnimeListEntry_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tracking invariants.

ALTER TABLE "AnimeListEntry"
ADD CONSTRAINT "AnimeListEntry_progressEpisodes_nonnegative_check"
CHECK ("progressEpisodes" >= 0);

ALTER TABLE "AnimeListEntry"
ADD CONSTRAINT "AnimeListEntry_rewatchCount_nonnegative_check"
CHECK ("rewatchCount" >= 0);

ALTER TABLE "AnimeListEntry"
ADD CONSTRAINT "AnimeListEntry_score_range_step_check"
CHECK (
  "score" IS NULL
  OR (
    "score" >= 1.0
    AND "score" <= 10.0
    AND MOD("score", 0.5) = 0
  )
);
