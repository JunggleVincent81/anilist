-- P16-W08: Staged spreadsheet batch ledger only; no public or canonical mutation.
-- Source migration must not be applied to active development/production without separate rollout approval.
CREATE TYPE "CatalogImportStatus" AS ENUM ('PREVIEWED','APPLIED');
CREATE TABLE "CatalogImportBatch" (
  "id" UUID NOT NULL,
  "creatorId" UUID NOT NULL,
  "subjectType" "EditorialSubjectType" NOT NULL,
  "fileName" VARCHAR(150) NOT NULL,
  "fileSha256" CHAR(64) NOT NULL,
  "format" VARCHAR(8) NOT NULL,
  "sourceName" VARCHAR(150) NOT NULL,
  "sourceReference" VARCHAR(450) NOT NULL,
  "status" "CatalogImportStatus" NOT NULL DEFAULT 'PREVIEWED',
  "rowCount" INTEGER NOT NULL,
  "validCount" INTEGER NOT NULL,
  "invalidCount" INTEGER NOT NULL,
  "createdCount" INTEGER NOT NULL DEFAULT 0,
  "skippedCount" INTEGER NOT NULL DEFAULT 0,
  "rows" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "appliedAt" TIMESTAMP(3),
  CONSTRAINT "CatalogImportBatch_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogImportBatch_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CatalogImportBatch_valid_counts" CHECK (
    "rowCount" BETWEEN 1 AND 100 AND "validCount" BETWEEN 0 AND "rowCount" AND
    "invalidCount" BETWEEN 0 AND "rowCount" AND "createdCount" >= 0 AND "skippedCount" >= 0 AND
    "createdCount" + "skippedCount" <= "rowCount" AND
    (("status" = 'PREVIEWED' AND "appliedAt" IS NULL AND "createdCount" = 0 AND "skippedCount" = 0)
       OR ("status" = 'APPLIED' AND "appliedAt" IS NOT NULL AND "invalidCount" = 0))
  ),
  CONSTRAINT "CatalogImportBatch_format_valid" CHECK ("format" IN ('CSV','XLSX'))
);
CREATE UNIQUE INDEX "CatalogImportBatch_creatorId_subjectType_fileSha256_key"
 ON "CatalogImportBatch"("creatorId","subjectType","fileSha256");
CREATE INDEX "CatalogImportBatch_creatorId_createdAt_id_idx" ON "CatalogImportBatch"("creatorId","createdAt","id");
CREATE INDEX "CatalogImportBatch_status_createdAt_id_idx" ON "CatalogImportBatch"("status","createdAt","id");
-- Prevent post-apply alteration of audit results (including a later re-preview).
CREATE FUNCTION "catalog_import_block_committed_rewrite"() RETURNS trigger AS $$
BEGIN
  IF OLD."status" = 'APPLIED' THEN
    RAISE EXCEPTION 'Committed import audit is immutable' USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "CatalogImportBatch_applied_immutable" BEFORE UPDATE OR DELETE ON "CatalogImportBatch"
 FOR EACH ROW EXECUTE FUNCTION "catalog_import_block_committed_rewrite"();

-- Accelerate fingerprint duplicate lookup for staged candidates.
CREATE INDEX "CatalogCandidate_subjectType_fingerprint_idx" ON "CatalogCandidate"("subjectType","fingerprint");
