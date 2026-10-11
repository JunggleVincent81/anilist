-- AN-160A: ADDITIVE PREPARATION ONLY. DO NOT APPLY TO DEVELOPMENT OR PRODUCTION.
-- No canonical data updates, no backfill, no new public API or publication action.
CREATE TYPE "EditorialSubjectType" AS ENUM (
  'ANIME','ANIME_EPISODE','MANGA_WORK','MANGA_VOLUME','MANGA_CHAPTER',
  'MUSIC_TRACK','MUSIC_RECORDING','MUSIC_RELEASE','MUSIC_ARTIST'
);
CREATE TYPE "EditorialCaseState" AS ENUM (
  'DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','REVOKED'
);
CREATE TABLE "CatalogCandidate" (
  "id" UUID NOT NULL,
  "subjectType" "EditorialSubjectType" NOT NULL,
  "sourceName" VARCHAR(150) NOT NULL,
  "sourceReference" VARCHAR(500) NOT NULL,
  "sourcePayload" JSONB NOT NULL,
  "normalizedPayload" JSONB,
  "fingerprint" CHAR(64),
  "isQuarantined" BOOLEAN NOT NULL DEFAULT true,
  "creatorId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogCandidate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EditorialCase" (
  "id" UUID NOT NULL,
  "subjectType" "EditorialSubjectType" NOT NULL,
  "candidateId" UUID,
  "legacyChangeRequestId" UUID,
  "canonicalEntityId" UUID,
  "state" "EditorialCaseState" NOT NULL DEFAULT 'DRAFT',
  "revision" INTEGER NOT NULL DEFAULT 1,
  "openedById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EditorialCase_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EditorialCase_revision_positive" CHECK ("revision" > 0)
);
CREATE INDEX "CatalogCandidate_subjectType_createdAt_id_idx" ON "CatalogCandidate"("subjectType","createdAt","id");
CREATE INDEX "CatalogCandidate_sourceName_sourceReference_idx" ON "CatalogCandidate"("sourceName","sourceReference");
CREATE INDEX "CatalogCandidate_creatorId_createdAt_id_idx" ON "CatalogCandidate"("creatorId","createdAt","id");
CREATE INDEX "CatalogCandidate_isQuarantined_createdAt_id_idx" ON "CatalogCandidate"("isQuarantined","createdAt","id");
CREATE UNIQUE INDEX "EditorialCase_legacyChangeRequestId_key" ON "EditorialCase"("legacyChangeRequestId");
CREATE INDEX "EditorialCase_candidateId_idx" ON "EditorialCase"("candidateId");
CREATE INDEX "EditorialCase_subjectType_state_createdAt_id_idx" ON "EditorialCase"("subjectType","state","createdAt","id");
CREATE INDEX "EditorialCase_subjectType_canonicalEntityId_idx" ON "EditorialCase"("subjectType","canonicalEntityId");
CREATE INDEX "EditorialCase_openedById_createdAt_id_idx" ON "EditorialCase"("openedById","createdAt","id");
ALTER TABLE "CatalogCandidate" ADD CONSTRAINT "CatalogCandidate_creatorId_fkey"
  FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EditorialCase" ADD CONSTRAINT "EditorialCase_candidateId_fkey"
  FOREIGN KEY ("candidateId") REFERENCES "CatalogCandidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EditorialCase" ADD CONSTRAINT "EditorialCase_legacyChangeRequestId_fkey"
  FOREIGN KEY ("legacyChangeRequestId") REFERENCES "CatalogChangeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EditorialCase" ADD CONSTRAINT "EditorialCase_openedById_fkey"
  FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
