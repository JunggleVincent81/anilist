-- CreateEnum
CREATE TYPE "CatalogChangeKind" AS ENUM ('SYNOPSIS', 'METADATA', 'AGE', 'ORIGIN', 'ARTWORK');

-- CreateEnum
CREATE TYPE "CatalogChangeState" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "CatalogEvidenceKind" AS ENUM ('OFFICIAL_RATING', 'EDITORIAL_ANALYSIS', 'PRODUCTION_ORIGIN', 'SYNOPSIS_RIGHTS', 'IMAGE_LICENSE');

-- CreateEnum
CREATE TYPE "CatalogReviewTrack" AS ENUM ('OFFICIAL_RATING', 'EDITORIAL', 'ORIGIN', 'SYNOPSIS', 'ARTWORK');

-- CreateEnum
CREATE TYPE "CatalogReviewAction" AS ENUM ('REQUEST_CHANGES', 'APPROVE', 'REJECT', 'REVOKE');

-- CreateEnum
CREATE TYPE "CatalogAssetKind" AS ENUM ('COVER', 'BANNER');

-- CreateEnum
CREATE TYPE "CatalogAssetState" AS ENUM ('STAGED', 'QUARANTINED', 'APPROVED', 'REVOKED');

-- CreateEnum
CREATE TYPE "CatalogDeliveryMode" AS ENUM ('OWN_STORAGE', 'EXTERNAL_EMBED');

-- CreateEnum
CREATE TYPE "CatalogRevisionAction" AS ENUM ('PUBLISH', 'REVOKE', 'ROLLBACK');

-- CreateTable
CREATE TABLE "CatalogChangeRequest" (
    "id" UUID NOT NULL,
    "animeId" UUID NOT NULL,
    "creatorId" UUID NOT NULL,
    "kind" "CatalogChangeKind" NOT NULL,
    "state" "CatalogChangeState" NOT NULL DEFAULT 'DRAFT',
    "baseAnimeUpdatedAt" TIMESTAMP(3) NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "proposedPatch" JSONB NOT NULL,
    "reason" VARCHAR(500),
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogEvidence" (
    "id" UUID NOT NULL,
    "changeRequestId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "kind" "CatalogEvidenceKind" NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "publisher" VARCHAR(191),
    "captureDate" DATE,
    "exactReleaseLabel" VARCHAR(255),
    "authority" VARCHAR(191),
    "jurisdiction" VARCHAR(80),
    "classificationScheme" VARCHAR(100),
    "licenseType" VARCHAR(100),
    "licenseTerms" TEXT,
    "attribution" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogReviewDecision" (
    "id" UUID NOT NULL,
    "changeRequestId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "reviewTrack" "CatalogReviewTrack" NOT NULL,
    "action" "CatalogReviewAction" NOT NULL,
    "draftRevision" INTEGER NOT NULL,
    "decisionNote" TEXT,
    "policyVersion" VARCHAR(60) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogReviewDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogAsset" (
    "id" UUID NOT NULL,
    "animeId" UUID NOT NULL,
    "changeRequestId" UUID NOT NULL,
    "uploaderId" UUID NOT NULL,
    "licenseEvidenceId" UUID,
    "kind" "CatalogAssetKind" NOT NULL,
    "state" "CatalogAssetState" NOT NULL DEFAULT 'STAGED',
    "storageKey" VARCHAR(512),
    "sha256" CHAR(64),
    "mime" VARCHAR(120),
    "byteLength" BIGINT,
    "width" INTEGER,
    "height" INTEGER,
    "sourceCopyrightOwner" VARCHAR(255),
    "allowedDeliveryMode" "CatalogDeliveryMode",
    "licenseExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogRevision" (
    "id" UUID NOT NULL,
    "animeId" UUID NOT NULL,
    "changeRequestId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "action" "CatalogRevisionAction" NOT NULL,
    "fieldMask" JSONB NOT NULL,
    "beforeSnapshot" JSONB NOT NULL,
    "afterSnapshot" JSONB NOT NULL,
    "policyVersion" VARCHAR(60) NOT NULL,
    "reason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogProductionCountry" (
    "id" UUID NOT NULL,
    "animeId" UUID NOT NULL,
    "changeRequestId" UUID NOT NULL,
    "evidenceId" UUID,
    "countryCode" CHAR(2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogProductionCountry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogChangeRequest_animeId_state_createdAt_id_idx" ON "CatalogChangeRequest"("animeId", "state", "createdAt", "id");

-- CreateIndex
CREATE INDEX "CatalogChangeRequest_state_createdAt_id_idx" ON "CatalogChangeRequest"("state", "createdAt", "id");

-- CreateIndex
CREATE INDEX "CatalogChangeRequest_creatorId_createdAt_id_idx" ON "CatalogChangeRequest"("creatorId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "CatalogEvidence_changeRequestId_createdAt_id_idx" ON "CatalogEvidence"("changeRequestId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "CatalogEvidence_createdById_createdAt_id_idx" ON "CatalogEvidence"("createdById", "createdAt", "id");

-- CreateIndex
CREATE INDEX "CatalogEvidence_kind_createdAt_id_idx" ON "CatalogEvidence"("kind", "createdAt", "id");

-- CreateIndex
CREATE INDEX "CatalogReviewDecision_changeRequestId_createdAt_id_idx" ON "CatalogReviewDecision"("changeRequestId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "CatalogReviewDecision_actorId_createdAt_id_idx" ON "CatalogReviewDecision"("actorId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogReviewDecision_changeRequestId_actorId_reviewTrack_d_key" ON "CatalogReviewDecision"("changeRequestId", "actorId", "reviewTrack", "draftRevision");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogAsset_storageKey_key" ON "CatalogAsset"("storageKey");

-- CreateIndex
CREATE INDEX "CatalogAsset_animeId_state_createdAt_id_idx" ON "CatalogAsset"("animeId", "state", "createdAt", "id");

-- CreateIndex
CREATE INDEX "CatalogAsset_changeRequestId_createdAt_id_idx" ON "CatalogAsset"("changeRequestId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "CatalogAsset_licenseEvidenceId_idx" ON "CatalogAsset"("licenseEvidenceId");

-- CreateIndex
CREATE INDEX "CatalogAsset_state_licenseExpiresAt_idx" ON "CatalogAsset"("state", "licenseExpiresAt");

-- CreateIndex
CREATE INDEX "CatalogRevision_animeId_createdAt_id_idx" ON "CatalogRevision"("animeId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "CatalogRevision_changeRequestId_createdAt_id_idx" ON "CatalogRevision"("changeRequestId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "CatalogRevision_actorId_createdAt_id_idx" ON "CatalogRevision"("actorId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "CatalogProductionCountry_animeId_countryCode_idx" ON "CatalogProductionCountry"("animeId", "countryCode");

-- CreateIndex
CREATE INDEX "CatalogProductionCountry_evidenceId_idx" ON "CatalogProductionCountry"("evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogProductionCountry_changeRequestId_countryCode_key" ON "CatalogProductionCountry"("changeRequestId", "countryCode");

-- AddForeignKey
ALTER TABLE "CatalogChangeRequest" ADD CONSTRAINT "CatalogChangeRequest_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogChangeRequest" ADD CONSTRAINT "CatalogChangeRequest_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogEvidence" ADD CONSTRAINT "CatalogEvidence_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "CatalogChangeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogEvidence" ADD CONSTRAINT "CatalogEvidence_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogReviewDecision" ADD CONSTRAINT "CatalogReviewDecision_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "CatalogChangeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogReviewDecision" ADD CONSTRAINT "CatalogReviewDecision_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogAsset" ADD CONSTRAINT "CatalogAsset_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogAsset" ADD CONSTRAINT "CatalogAsset_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "CatalogChangeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogAsset" ADD CONSTRAINT "CatalogAsset_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogAsset" ADD CONSTRAINT "CatalogAsset_licenseEvidenceId_fkey" FOREIGN KEY ("licenseEvidenceId") REFERENCES "CatalogEvidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogRevision" ADD CONSTRAINT "CatalogRevision_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogRevision" ADD CONSTRAINT "CatalogRevision_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "CatalogChangeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogRevision" ADD CONSTRAINT "CatalogRevision_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProductionCountry" ADD CONSTRAINT "CatalogProductionCountry_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProductionCountry" ADD CONSTRAINT "CatalogProductionCountry_changeRequestId_fkey" FOREIGN KEY ("changeRequestId") REFERENCES "CatalogChangeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProductionCountry" ADD CONSTRAINT "CatalogProductionCountry_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "CatalogEvidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
