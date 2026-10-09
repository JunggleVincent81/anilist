# AN-139B2 — Safe Image Metadata Foundation

Status: user-approved implementation; **not an artwork usage authorization**.

## Scope

- The offline import normalizer now recognizes `picture` and `thumbnail` as **candidate source metadata** in `NormalizedAnimeRecord.imageCandidates`.
- Each accepted candidate records `sourceDataset`, `sourceField`, `sourceHost`, and `sourceUrl`, together with immutable-at-normalization conservative values: `rightsStatus: UNVERIFIED`, `displayApproved: false`, `ageApproved: false`.
- HTTPS-only syntax; exact known dataset hostnames; no credentials/non-standard port/fragments; bounded URL length; known placeholder paths rejected. Sensitive-category path words are `riskHints` **only**, not age classifications.
- Known dataset hosts represent recognition of existing sources, **not permission for hotlinking, caching, proxying, or mirroring**.
- No external image HTTP requests, no migration, no image download, no database backfill, no `coverImageUrl` write, no public GraphQL fields or homepage changes.
- Existing `AnimeImportService` explicitly remains outside this change and does not consume or persist `imageCandidates`. Re-running imports is NOT part of AN-139B2.

## Boundary & follow-up

The candidate list is transient normalized source metadata; it is **not persisted** and thus does not itself create a curated asset database. Future persistence should have explicit source/rights evidence, user approval, revocation, and display-mode guards. Studio/distributor licensed art or manually curated, verified assets are alternatives to unlicensed syndicated posters.

AN-139B3 requires a separate copyright and hotlink gate plus scoped user approval. AN-139C requires age/origin evidence. Do not assign `isAdult=false` from URLs or URLs from age policy. The homepage may legitimately remain empty until those gates are resolved.

The proposed future first-party catalog authoring/editor workflow for manually supplied anime posters and synopses is **out of scope**, including any user submissions, upload infrastructure, or CMS.
