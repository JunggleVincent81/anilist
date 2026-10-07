-- CreateEnum
CREATE TYPE "AnimeRelationType" AS ENUM ('SEQUEL', 'SIDE_STORY', 'SPIN_OFF', 'ALTERNATIVE', 'SUMMARY', 'COMPILATION', 'CONTAINS', 'OTHER');

-- CreateTable
CREATE TABLE "AnimeRelation" (
    "id" UUID NOT NULL,
    "sourceAnimeId" UUID NOT NULL,
    "targetAnimeId" UUID NOT NULL,
    "type" "AnimeRelationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnimeRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnimeRelation_sourceAnimeId_idx" ON "AnimeRelation"("sourceAnimeId");

-- CreateIndex
CREATE INDEX "AnimeRelation_targetAnimeId_idx" ON "AnimeRelation"("targetAnimeId");

-- CreateIndex
CREATE INDEX "AnimeRelation_sourceAnimeId_type_idx" ON "AnimeRelation"("sourceAnimeId", "type");

-- CreateIndex
CREATE INDEX "AnimeRelation_targetAnimeId_type_idx" ON "AnimeRelation"("targetAnimeId", "type");

-- CreateIndex
CREATE INDEX "AnimeRelation_type_idx" ON "AnimeRelation"("type");

-- CreateIndex
CREATE UNIQUE INDEX "AnimeRelation_sourceAnimeId_targetAnimeId_type_key" ON "AnimeRelation"("sourceAnimeId", "targetAnimeId", "type");

-- AddForeignKey
ALTER TABLE "AnimeRelation" ADD CONSTRAINT "AnimeRelation_sourceAnimeId_fkey" FOREIGN KEY ("sourceAnimeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeRelation" ADD CONSTRAINT "AnimeRelation_targetAnimeId_fkey" FOREIGN KEY ("targetAnimeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Anime cannot relate to itself.
ALTER TABLE "AnimeRelation"
ADD CONSTRAINT "AnimeRelation_no_self_relation_check"
CHECK (
  "sourceAnimeId" <> "targetAnimeId"
);
