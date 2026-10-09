# AN-143 — Private Synopsis Editor UI

Status: PATCH PREPARED — local verification pending.

- New administrator-only `/admin/catalog/synopsis?animeId=<uuid>` UI links from the existing read-only catalog list.
- Uses AN-142 authenticated GraphQL mutations and ownership-restricted draft lookup; saves explicit expectedRevision.
- Draft IDs are visible to the author; reopening requires the draft ID, which is not authorization by itself.
- Server RolesGuard remains authoritative; UI also gates anonymous and non-ADMIN users.
- No migrations, canonical Anime update, publication, classification edit, asset usage, external fetch, or role assignment.
- Verify API/web quality gates, GraphQL live authenticated authorization and browser accessibility independently.
- Known limitation: no first-party listing of drafts; save the displayed draft ID to resume editing.
