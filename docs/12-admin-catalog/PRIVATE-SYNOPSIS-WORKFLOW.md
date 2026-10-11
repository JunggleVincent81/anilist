# Private Synopsis Draft, Submission and Review

Admin drafts belong to their creators; optimistic revision checks and independent human review are required. Approved publication and canonical Anime mutation are not implemented.

> Consolidated technical reference. Earlier milestone status lines are historical; current status is specified in the phase completion report.


---

## 142 Private Synopsis Draft Foundation

*Historical source: `AN-142-PRIVATE-SYNOPSIS-DRAFT-FOUNDATION.md`.*

Status: LOCAL QUALITY GATES PASSED; live E2E and remote CI pending.

Scope: ADMIN-only GraphQL create/read/update for original synopsis proposals in existing `CatalogChangeRequest` model. Create records with `SYNOPSIS` and `DRAFT`, bind to actor and Anime baseline timestamp. Update uses conditional `updateMany` revision increment and owner/state guards. No new migration, canonical Anime update, submission/review/approval, public frontend publication, image usage, age changes, or role assignment. Only draft owner reads/edits their private drafts. ADMIN role does not permit editing another ADMIN's draft.

Contract: `createAdminSynopsisDraft(input)`, `adminSynopsisDraft(draftId)`, and `updateAdminSynopsisDraft(input)`.

Important: This backend foundation does not include an editor UI. Browser QA, real ADMIN/MODERATOR E2E, and CI still need independent verification. Do not mark Phase 12 complete from this checkpoint.


---

## 143 Private Synopsis Editor

*Historical source: `AN-143-PRIVATE-SYNOPSIS-EDITOR.md`.*

Status: PATCH PREPARED — local verification pending.

- New administrator-only `/admin/catalog/synopsis?animeId=<uuid>` UI links from the existing read-only catalog list.
- Uses AN-142 authenticated GraphQL mutations and ownership-restricted draft lookup; saves explicit expectedRevision.
- Draft IDs are visible to the author; reopening requires the draft ID, which is not authorization by itself.
- Server RolesGuard remains authoritative; UI also gates anonymous and non-ADMIN users.
- No migrations, canonical Anime update, publication, classification edit, asset usage, external fetch, or role assignment.
- Verify API/web quality gates, GraphQL live authenticated authorization and browser accessibility independently.
- Known limitation: no first-party listing of drafts; save the displayed draft ID to resume editing.


---

## 144 Private Synopsis Submission Review

*Historical source: `AN-144-PRIVATE-SYNOPSIS-SUBMISSION-REVIEW.md`.*

Status: PATCH PREPARED; local quality gates and live authenticated E2E pending.

- ADMIN-only `submitAdminSynopsisDraft`, owner/revision-checked `DRAFT` -> `SUBMITTED`.
- ADMIN-only `reviewAdminSynopsisSubmission`: independent reviewer, `SUBMITTED`/`UNDER_REVIEW` -> `DRAFT` (`REQUEST_CHANGES`) or `REJECTED` (`REJECT`).
- Review state CAS and immutable `CatalogReviewDecision` creation in the same database transaction.
- `APPROVE`, canonical Anime writes, `isAdult`, external image fetching, publication, and migrations are deliberately excluded.
- Review queue/UI, live ADMIN/MODERATOR authentication and DB integration testing remain separate acceptance work.
- Returning a request to DRAFT retains ownership and permits creator edits under AN-142.


---

## 145 Private Synopsis Review Ui

*Historical source: `AN-145-PRIVATE-SYNOPSIS-REVIEW-UI.md`.*

Status: PATCH PREPARED — local quality gates, live admin-auth E2E, and database integration pending.

- Adds an ADMIN-only paged GraphQL review queue for submitted synopsis proposals, without raw asset URLs.
- Adds review queue UI and entry link from protected admin catalog. Creator's own submissions cannot be reviewed (server also enforces).
- Connects existing saved draft editor to the AN-144 submit mutation with an expected revision. Only saved text may be submitted.
- Review actions are REQUEST_CHANGES / REJECT, with required human rationale. APPROVE and publication remain unavailable.
- All queues are private; no canonical Anime mutation, role assignment, age change, migration, external requests, or public route.
- Query caps per-page to 20 and upper-bounds page number to 10000. Policy acceptance and full E2E still required.
