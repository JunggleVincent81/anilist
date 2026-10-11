-- AN-157B: additive, curator-evidenced anime/music usage; no public exposure or backfill.
-- Existing AnimeMusicTrack.animeId is intentionally preserved for legacy compatibility.
CREATE TABLE "AnimeMusicUsage" (
  "id" UUID NOT NULL,
  "animeId" UUID NOT NULL,
  "animeMusicTrackId" UUID NOT NULL,
  "usageKey" VARCHAR(180) NOT NULL,
  "usageType" "AnimeMusicCategory" NOT NULL,
  "episodeStart" INTEGER,
  "episodeEnd" INTEGER,
  "sourceName" VARCHAR(150) NOT NULL,
  "sourceReference" VARCHAR(500) NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnimeMusicUsage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AnimeMusicUsage_usageKey_nonempty_chk" CHECK (length(btrim("usageKey")) > 0),
  CONSTRAINT "AnimeMusicUsage_sourceName_nonempty_chk" CHECK (length(btrim("sourceName")) > 0),
  CONSTRAINT "AnimeMusicUsage_sourceReference_nonempty_chk" CHECK (length(btrim("sourceReference")) > 0),
  CONSTRAINT "AnimeMusicUsage_episodeStart_positive_chk" CHECK ("episodeStart" > 0),
  CONSTRAINT "AnimeMusicUsage_episodeEnd_positive_chk" CHECK ("episodeEnd" > 0),
  CONSTRAINT "AnimeMusicUsage_episodeRange_chk" CHECK (
    "episodeEnd" IS NULL OR ("episodeStart" IS NOT NULL AND "episodeEnd" >= "episodeStart")
  )
);
CREATE UNIQUE INDEX "AnimeMusicUsage_animeId_animeMusicTrackId_usageKey_key"
  ON "AnimeMusicUsage"("animeId", "animeMusicTrackId", "usageKey");
CREATE INDEX "AnimeMusicUsage_animeId_usageType_idx"
  ON "AnimeMusicUsage"("animeId", "usageType");
CREATE INDEX "AnimeMusicUsage_animeMusicTrackId_usageType_idx"
  ON "AnimeMusicUsage"("animeMusicTrackId", "usageType");
CREATE INDEX "AnimeMusicUsage_isPublished_usageType_idx"
  ON "AnimeMusicUsage"("isPublished", "usageType");
ALTER TABLE "AnimeMusicUsage" ADD CONSTRAINT "AnimeMusicUsage_animeId_fkey"
  FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AnimeMusicUsage" ADD CONSTRAINT "AnimeMusicUsage_animeMusicTrackId_fkey"
  FOREIGN KEY ("animeMusicTrackId") REFERENCES "AnimeMusicTrack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
