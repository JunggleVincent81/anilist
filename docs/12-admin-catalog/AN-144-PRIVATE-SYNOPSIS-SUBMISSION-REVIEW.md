# AN-144 — Private synopsis submission & restricted review

Status: PATCH PREPARED; local quality gates and live authenticated E2E pending.

- ADMIN-only `submitAdminSynopsisDraft`, owner/revision-checked `DRAFT` -> `SUBMITTED`.
- ADMIN-only `reviewAdminSynopsisSubmission`: independent reviewer, `SUBMITTED`/`UNDER_REVIEW` -> `DRAFT` (`REQUEST_CHANGES`) or `REJECTED` (`REJECT`).
- Review state CAS and immutable `CatalogReviewDecision` creation in the same database transaction.
- `APPROVE`, canonical Anime writes, `isAdult`, external image fetching, publication, and migrations are deliberately excluded.
- Review queue/UI, live ADMIN/MODERATOR authentication and DB integration testing remain separate acceptance work.
- Returning a request to DRAFT retains ownership and permits creator edits under AN-142.
