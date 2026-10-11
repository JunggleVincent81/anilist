-- P16-W05: Private relationship proposals ONLY. Does not modify canonical records or release state.
-- Apply only via separately approved DB rollout. Disposable PG rehearsal in local runner.
CREATE TYPE "CatalogRelationKind" AS ENUM (
  'ANIME_MANGA', 'ANIME_MUSIC_USAGE', 'ANIME_EPISODE', 'MUSIC_RELEASE_TRACK',
  'MUSIC_CREDIT_TRACK', 'MUSIC_CREDIT_RECORDING', 'MUSIC_CREDIT_RELEASE', 'MUSIC_CREDIT_RELEASE_TRACK'
);

CREATE TABLE "CatalogRelationProposal" (
  "id" UUID NOT NULL,
  "kind" "CatalogRelationKind" NOT NULL,
  "sourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "relationKey" VARCHAR(180) NOT NULL,
  "details" JSONB NOT NULL,
  "sourceName" VARCHAR(150) NOT NULL,
  "sourceReference" VARCHAR(500) NOT NULL,
  "creatorId" UUID NOT NULL,
  "isQuarantined" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogRelationProposal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogRelationProposal_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CatalogRelationProposal_always_quarantined" CHECK ("isQuarantined" = true)
);
CREATE UNIQUE INDEX "CatalogRelationProposal_kind_sourceId_targetId_relationKey_key"
 ON "CatalogRelationProposal"("kind", "sourceId", "targetId", "relationKey");
CREATE INDEX "CatalogRelationProposal_kind_createdAt_id_idx" ON "CatalogRelationProposal"("kind", "createdAt", "id");
CREATE INDEX "CatalogRelationProposal_creatorId_createdAt_id_idx" ON "CatalogRelationProposal"("creatorId", "createdAt", "id");
-- A release slot can contain one recording; a second proposal for the same slot must not be staged.
CREATE UNIQUE INDEX "CatalogRelationProposal_release_slot_unique" ON "CatalogRelationProposal"("kind", "sourceId", "relationKey")
 WHERE "kind" = 'MUSIC_RELEASE_TRACK'::"CatalogRelationKind";
