-- AN-162A: additive, private, immutable audit ledger preparation ONLY.
-- DO NOT APPLY TO DEVELOPMENT/PRODUCTION. No canonical writes, backfill or public API.
CREATE TYPE "EditorialTransitionAction" AS ENUM (
  'SUBMIT','BEGIN_REVIEW','REQUEST_CHANGES','REJECT'
);
CREATE TABLE "EditorialCaseTransition" (
  "id" UUID NOT NULL,
  "caseId" UUID NOT NULL,
  "actorId" UUID NOT NULL,
  "action" "EditorialTransitionAction" NOT NULL,
  "fromState" "EditorialCaseState" NOT NULL,
  "toState" "EditorialCaseState" NOT NULL,
  "previousRevision" INTEGER NOT NULL,
  "nextRevision" INTEGER NOT NULL,
  "policyVersion" VARCHAR(60) NOT NULL,
  "note" VARCHAR(2000),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EditorialCaseTransition_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EditorialCaseTransition_revision_chain" CHECK (
    "previousRevision" >= 1 AND "nextRevision" = "previousRevision" + 1
  ),
  CONSTRAINT "EditorialCaseTransition_action_state" CHECK (
    ("action" = 'SUBMIT' AND "fromState" = 'DRAFT' AND "toState" = 'SUBMITTED') OR
    ("action" = 'BEGIN_REVIEW' AND "fromState" = 'SUBMITTED' AND "toState" = 'UNDER_REVIEW') OR
    ("action" = 'REQUEST_CHANGES' AND "fromState" IN ('SUBMITTED','UNDER_REVIEW') AND "toState" = 'DRAFT') OR
    ("action" = 'REJECT' AND "fromState" IN ('SUBMITTED','UNDER_REVIEW') AND "toState" = 'REJECTED')
  ),
  CONSTRAINT "EditorialCaseTransition_human_review_note" CHECK (
    "action" NOT IN ('REQUEST_CHANGES','REJECT') OR
    ("note" IS NOT NULL AND char_length(btrim("note")) BETWEEN 5 AND 2000)
  )
);
CREATE UNIQUE INDEX "EditorialCaseTransition_caseId_nextRevision_key"
  ON "EditorialCaseTransition"("caseId","nextRevision");
CREATE INDEX "EditorialCaseTransition_caseId_createdAt_id_idx"
  ON "EditorialCaseTransition"("caseId","createdAt","id");
CREATE INDEX "EditorialCaseTransition_actorId_createdAt_id_idx"
  ON "EditorialCaseTransition"("actorId","createdAt","id");
ALTER TABLE "EditorialCaseTransition"
  ADD CONSTRAINT "EditorialCaseTransition_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "EditorialCase"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EditorialCaseTransition"
  ADD CONSTRAINT "EditorialCaseTransition_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
-- Application roles cannot mutate/delete the historical event ledger.
CREATE FUNCTION "editorial_case_transition_block_rewrite"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'EditorialCaseTransition is append-only' USING ERRCODE = '55000';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "EditorialCaseTransition_append_only"
  BEFORE UPDATE OR DELETE ON "EditorialCaseTransition"
  FOR EACH ROW EXECUTE FUNCTION "editorial_case_transition_block_rewrite"();
