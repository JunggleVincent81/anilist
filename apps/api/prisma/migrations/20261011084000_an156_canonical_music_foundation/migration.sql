-- AN-156: additive canonical music foundation; no data migration or backfill.
CREATE TYPE "MusicCreditKind" AS ENUM ('PRIMARY_ARTIST', 'CONTRIBUTOR');
CREATE TYPE "MusicReleaseType" AS ENUM ('SINGLE', 'EP', 'ALBUM', 'SOUNDTRACK', 'OTHER');

CREATE TABLE "MusicArtist" (
 "id" UUID NOT NULL, "artistKey" VARCHAR(220) NOT NULL, "displayName" VARCHAR(250) NOT NULL,
 "sourceName" VARCHAR(150) NOT NULL, "sourceReference" VARCHAR(500) NOT NULL,
 "isPublished" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "MusicArtist_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MusicArtist_artistKey_key" ON "MusicArtist"("artistKey");
CREATE INDEX "MusicArtist_isPublished_displayName_idx" ON "MusicArtist"("isPublished", "displayName");

CREATE TABLE "MusicRecording" (
 "id" UUID NOT NULL, "recordingKey" VARCHAR(220) NOT NULL, "animeMusicTrackId" UUID,
 "title" VARCHAR(500) NOT NULL, "versionLabel" VARCHAR(250), "durationMs" INTEGER,
 "sourceName" VARCHAR(150) NOT NULL, "sourceReference" VARCHAR(500) NOT NULL,
 "isPublished" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "MusicRecording_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "MusicRecording_duration_positive_chk" CHECK ("durationMs" > 0)
);
CREATE UNIQUE INDEX "MusicRecording_recordingKey_key" ON "MusicRecording"("recordingKey");
CREATE INDEX "MusicRecording_animeMusicTrackId_idx" ON "MusicRecording"("animeMusicTrackId");
CREATE INDEX "MusicRecording_isPublished_title_idx" ON "MusicRecording"("isPublished", "title");
ALTER TABLE "MusicRecording" ADD CONSTRAINT "MusicRecording_animeMusicTrackId_fkey"
 FOREIGN KEY ("animeMusicTrackId") REFERENCES "AnimeMusicTrack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "MusicRelease" (
 "id" UUID NOT NULL, "releaseKey" VARCHAR(220) NOT NULL, "title" VARCHAR(500) NOT NULL,
 "releaseType" "MusicReleaseType" NOT NULL DEFAULT 'OTHER', "releaseDate" DATE,
 "sourceName" VARCHAR(150) NOT NULL, "sourceReference" VARCHAR(500) NOT NULL,
 "isPublished" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "MusicRelease_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MusicRelease_releaseKey_key" ON "MusicRelease"("releaseKey");
CREATE INDEX "MusicRelease_isPublished_releaseType_title_idx" ON "MusicRelease"("isPublished", "releaseType", "title");

CREATE TABLE "MusicReleaseTrack" (
 "id" UUID NOT NULL, "releaseId" UUID NOT NULL, "recordingId" UUID NOT NULL,
 "discNumber" INTEGER NOT NULL DEFAULT 1, "trackNumber" INTEGER NOT NULL,
 "displayTitle" VARCHAR(500), "isPublished" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "MusicReleaseTrack_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "MusicReleaseTrack_disc_positive_chk" CHECK ("discNumber" > 0),
 CONSTRAINT "MusicReleaseTrack_track_positive_chk" CHECK ("trackNumber" > 0)
);
CREATE UNIQUE INDEX "MusicReleaseTrack_releaseId_discNumber_trackNumber_key"
 ON "MusicReleaseTrack"("releaseId", "discNumber", "trackNumber");
CREATE INDEX "MusicReleaseTrack_recordingId_idx" ON "MusicReleaseTrack"("recordingId");
ALTER TABLE "MusicReleaseTrack" ADD CONSTRAINT "MusicReleaseTrack_releaseId_fkey"
 FOREIGN KEY ("releaseId") REFERENCES "MusicRelease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MusicReleaseTrack" ADD CONSTRAINT "MusicReleaseTrack_recordingId_fkey"
 FOREIGN KEY ("recordingId") REFERENCES "MusicRecording"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "MusicCredit" (
 "id" UUID NOT NULL, "artistId" UUID NOT NULL,
 "animeMusicTrackId" UUID, "recordingId" UUID, "releaseId" UUID, "releaseTrackId" UUID,
 "kind" "MusicCreditKind" NOT NULL, "role" VARCHAR(100) NOT NULL,
 "creditedAs" VARCHAR(250), "position" INTEGER,
 "sourceName" VARCHAR(150) NOT NULL, "sourceReference" VARCHAR(500) NOT NULL,
 "isPublished" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "MusicCredit_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "MusicCredit_exactly_one_target_chk" CHECK (
   num_nonnulls("animeMusicTrackId", "recordingId", "releaseId", "releaseTrackId") = 1
 ),
 CONSTRAINT "MusicCredit_position_positive_chk" CHECK ("position" > 0)
);
CREATE INDEX "MusicCredit_artistId_kind_position_idx" ON "MusicCredit"("artistId", "kind", "position");
CREATE INDEX "MusicCredit_animeMusicTrackId_idx" ON "MusicCredit"("animeMusicTrackId");
CREATE INDEX "MusicCredit_recordingId_idx" ON "MusicCredit"("recordingId");
CREATE INDEX "MusicCredit_releaseId_idx" ON "MusicCredit"("releaseId");
CREATE INDEX "MusicCredit_releaseTrackId_idx" ON "MusicCredit"("releaseTrackId");
ALTER TABLE "MusicCredit" ADD CONSTRAINT "MusicCredit_artistId_fkey"
 FOREIGN KEY ("artistId") REFERENCES "MusicArtist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MusicCredit" ADD CONSTRAINT "MusicCredit_animeMusicTrackId_fkey"
 FOREIGN KEY ("animeMusicTrackId") REFERENCES "AnimeMusicTrack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MusicCredit" ADD CONSTRAINT "MusicCredit_recordingId_fkey"
 FOREIGN KEY ("recordingId") REFERENCES "MusicRecording"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MusicCredit" ADD CONSTRAINT "MusicCredit_releaseId_fkey"
 FOREIGN KEY ("releaseId") REFERENCES "MusicRelease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MusicCredit" ADD CONSTRAINT "MusicCredit_releaseTrackId_fkey"
 FOREIGN KEY ("releaseTrackId") REFERENCES "MusicReleaseTrack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
