# AN-145 — Private Synopsis Review Workflow UI

Status: PATCH PREPARED — local quality gates, live admin-auth E2E, and database integration pending.

- Adds an ADMIN-only paged GraphQL review queue for submitted synopsis proposals, without raw asset URLs.
- Adds review queue UI and entry link from protected admin catalog. Creator's own submissions cannot be reviewed (server also enforces).
- Connects existing saved draft editor to the AN-144 submit mutation with an expected revision. Only saved text may be submitted.
- Review actions are REQUEST_CHANGES / REJECT, with required human rationale. APPROVE and publication remain unavailable.
- All queues are private; no canonical Anime mutation, role assignment, age change, migration, external requests, or public route.
- Query caps per-page to 20 and upper-bounds page number to 10000. Policy acceptance and full E2E still required.
