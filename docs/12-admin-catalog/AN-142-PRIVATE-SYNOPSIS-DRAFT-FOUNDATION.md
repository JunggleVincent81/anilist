# AN-142 — Private Synopsis Draft Foundation

Status: LOCAL QUALITY GATES PASSED; live E2E and remote CI pending.

Scope: ADMIN-only GraphQL create/read/update for original synopsis proposals in existing `CatalogChangeRequest` model. Create records with `SYNOPSIS` and `DRAFT`, bind to actor and Anime baseline timestamp. Update uses conditional `updateMany` revision increment and owner/state guards. No new migration, canonical Anime update, submission/review/approval, public frontend publication, image usage, age changes, or role assignment. Only draft owner reads/edits their private drafts. ADMIN role does not permit editing another ADMIN's draft.

Contract: `createAdminSynopsisDraft(input)`, `adminSynopsisDraft(draftId)`, and `updateAdminSynopsisDraft(input)`.

Important: This backend foundation does not include an editor UI. Browser QA, real ADMIN/MODERATOR E2E, and CI still need independent verification. Do not mark Phase 12 complete from this checkpoint.
