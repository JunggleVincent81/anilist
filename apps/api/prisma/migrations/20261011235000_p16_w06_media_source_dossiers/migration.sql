-- P16-W06 source/evidence claim and image METADATA intake. No bytes, delivery, canonical changes or approval.
-- Separate explicit rollout approval required for development / production PostgreSQL.
CREATE TABLE "CatalogSourceDossier" (
  "id" UUID NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "publisher" VARCHAR(191) NOT NULL,
  "rightsBasis" VARCHAR(500) NOT NULL,
  "licenseLabel" VARCHAR(100),
  "attribution" VARCHAR(500),
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdById" UUID NOT NULL,
  "isQuarantined" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CatalogSourceDossier_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogSourceDossier_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CatalogSourceDossier_always_quarantined" CHECK ("isQuarantined" = true),
  CONSTRAINT "CatalogSourceDossier_revocation_after_creation" CHECK ("revokedAt" IS NULL OR "revokedAt" >= "createdAt")
);
CREATE INDEX "CatalogSourceDossier_createdById_createdAt_id_idx" ON "CatalogSourceDossier"("createdById","createdAt","id");
CREATE INDEX "CatalogSourceDossier_revokedAt_expiresAt_idx" ON "CatalogSourceDossier"("revokedAt","expiresAt");

CREATE TABLE "CatalogMediaIntake" (
  "id" UUID NOT NULL,
  "animeId" UUID NOT NULL,
  "sourceDossierId" UUID NOT NULL,
  "uploaderId" UUID NOT NULL,
  "kind" "CatalogAssetKind" NOT NULL,
  "sha256" CHAR(64) NOT NULL,
  "mime" VARCHAR(120) NOT NULL,
  "byteLength" INTEGER NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "copyrightOwner" VARCHAR(255) NOT NULL,
  "isQuarantined" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CatalogMediaIntake_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogMediaIntake_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CatalogMediaIntake_sourceDossierId_fkey" FOREIGN KEY ("sourceDossierId") REFERENCES "CatalogSourceDossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CatalogMediaIntake_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CatalogMediaIntake_always_quarantined" CHECK ("isQuarantined" = true),
  CONSTRAINT "CatalogMediaIntake_metadata_valid" CHECK ("byteLength" > 0 AND "byteLength" <= 50000000 AND "width" > 0 AND "width" <= 20000 AND "height" > 0 AND "height" <= 20000)
);
CREATE UNIQUE INDEX "CatalogMediaIntake_animeId_kind_sha256_key" ON "CatalogMediaIntake"("animeId","kind","sha256");
CREATE INDEX "CatalogMediaIntake_uploaderId_createdAt_id_idx" ON "CatalogMediaIntake"("uploaderId","createdAt","id");
CREATE INDEX "CatalogMediaIntake_sourceDossierId_idx" ON "CatalogMediaIntake"("sourceDossierId");
