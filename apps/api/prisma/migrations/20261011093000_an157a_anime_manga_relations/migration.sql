-- AN-157A: additive curated anime-to-manga relations; no seed/backfill/public API.
CREATE TYPE "AnimeMangaRelationType" AS ENUM
  ('ADAPTATION','SOURCE_MATERIAL','SPIN_OFF','SIDE_STORY','RELATED','OTHER');
CREATE TABLE "AnimeMangaRelation" (
  "id" UUID NOT NULL,
  "animeId" UUID NOT NULL,
  "mangaWorkId" UUID NOT NULL,
  "relationType" "AnimeMangaRelationType" NOT NULL,
  "sourceName" VARCHAR(150) NOT NULL,
  "sourceReference" VARCHAR(500) NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnimeMangaRelation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AnimeMangaRelation_sourceName_nonempty_chk" CHECK (length(btrim("sourceName")) > 0),
  CONSTRAINT "AnimeMangaRelation_sourceReference_nonempty_chk" CHECK (length(btrim("sourceReference")) > 0)
);
CREATE UNIQUE INDEX "AnimeMangaRelation_animeId_mangaWorkId_relationType_key"
  ON "AnimeMangaRelation"("animeId","mangaWorkId","relationType");
CREATE INDEX "AnimeMangaRelation_animeId_relationType_idx"
  ON "AnimeMangaRelation"("animeId","relationType");
CREATE INDEX "AnimeMangaRelation_mangaWorkId_relationType_idx"
  ON "AnimeMangaRelation"("mangaWorkId","relationType");
CREATE INDEX "AnimeMangaRelation_isPublished_relationType_idx"
  ON "AnimeMangaRelation"("isPublished","relationType");
ALTER TABLE "AnimeMangaRelation" ADD CONSTRAINT "AnimeMangaRelation_animeId_fkey"
  FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AnimeMangaRelation" ADD CONSTRAINT "AnimeMangaRelation_mangaWorkId_fkey"
  FOREIGN KEY ("mangaWorkId") REFERENCES "MangaWork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
