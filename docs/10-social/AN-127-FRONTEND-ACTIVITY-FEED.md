# AN-127 — Activity Feed Frontend V1

Status: Local implementation and verification complete; remote CI pending.

## Scope

- Home (`/`) now shows the social activity feed in the existing application shell.
- Public feed available anonymously; Following feed requires a session.
- Authenticated members can create text posts (1–500 characters after trim).
- Like/unlike and first page of replies with authenticated reply composer.
- Pagination, loading, empty, failure and retry states.
- Existing GraphQL credentialed client is reused; no auth bypass or new dependency.

## Known V1 limitations

- Like selection is tracked for the current page session only: API feed items do not expose `viewerHasLiked`. Counts are reloaded after mutation; subsequent sessions initially display the neutral Like state.
- Replies initially show the first 20 only; dedicated per-activity reply pagination is a later enhancement.
- Notifications, reviews, moderation and profile-feed UI are follow-up frontend integrations.
- Production deployment is explicitly deferred.

## Validation

`pnpm --filter @anime-platform/web test`, `typecheck`, `lint`, `build`;
`pnpm --filter @anime-platform/api test`, `typecheck`, `build`;
`python scripts/verify-activity-feed-contract.py` (read-only on an ephemeral port).
