-- AN-166: separate, append-only record of Anime.description-only canonical commits.
-- No canonical DML and no public activation in this migration.
CREATE TABLE "EditorialSynopsisCommit" (
  "id" UUID NOT NULL,
  "caseId" UUID NOT NULL,
  "approvalId" UUID NOT NULL,
  "animeId" UUID NOT NULL,
  "actorId" UUID NOT NULL,
  "beforeDescription" TEXT,
  "afterDescription" TEXT NOT NULL,
  "beforeUpdatedAt" TIMESTAMP(3) NOT NULL,
  "afterUpdatedAt" TIMESTAMP(3) NOT NULL,
  "synopsisDigest" CHAR(64) NOT NULL,
  "policyVersion" VARCHAR(60) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EditorialSynopsisCommit_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EditorialSynopsisCommit_text_nonempty" CHECK (length(btrim("afterDescription")) BETWEEN 1 AND 10000),
  CONSTRAINT "EditorialSynopsisCommit_digest_hex" CHECK ("synopsisDigest" ~ '^[0-9a-f]{64}$')
);
CREATE UNIQUE INDEX "EditorialSynopsisCommit_caseId_key" ON "EditorialSynopsisCommit"("caseId");
CREATE UNIQUE INDEX "EditorialSynopsisCommit_approvalId_key" ON "EditorialSynopsisCommit"("approvalId");
CREATE INDEX "EditorialSynopsisCommit_animeId_idx" ON "EditorialSynopsisCommit"("animeId");
CREATE INDEX "EditorialSynopsisCommit_actorId_idx" ON "EditorialSynopsisCommit"("actorId");
ALTER TABLE "EditorialSynopsisCommit" ADD CONSTRAINT "EditorialSynopsisCommit_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "EditorialCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EditorialSynopsisCommit" ADD CONSTRAINT "EditorialSynopsisCommit_approvalId_fkey"
  FOREIGN KEY ("approvalId") REFERENCES "EditorialSynopsisApproval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EditorialSynopsisCommit" ADD CONSTRAINT "EditorialSynopsisCommit_animeId_fkey"
  FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EditorialSynopsisCommit" ADD CONSTRAINT "EditorialSynopsisCommit_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE FUNCTION "editorial_synopsis_commit_block_rewrite"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'EditorialSynopsisCommit is append-only' USING ERRCODE = '55000';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "EditorialSynopsisCommit_append_only"
  BEFORE UPDATE OR DELETE ON "EditorialSynopsisCommit"
  FOR EACH ROW EXECUTE FUNCTION "editorial_synopsis_commit_block_rewrite"();
