# Phase 04 Validation

**Phase:** 04 — Anime Database & Discovery  
**Status:** COMPLETE  
**Validation date:** 2026-10-07

## Database Snapshot

```text
Anime             38,288

INCLUDED           31,270
REVIEW              6,579
EXCLUDED              439

ExternalAnimeId   191,652
```

The final Anime count matches the validated raw bootstrap record count.

The final ExternalAnimeId count matches the validated unique raw source URL
count.

## Migration Set

Phase 4 introduced:

```
20261006050540_add_anime_domain
20261006054356_add_anime_taxonomy
20261006060454_add_anime_relations
20261006061147_add_anime_canonical_title
20261006063009_replace_anime_title_constraint
20261006115752_add_anime_catalog_eligibility
20261007013039_add_ann_anime_provider
```

## Automated Tests

Final API test run:

```
Test Suites: 15 passed, 15 total
Tests:       69 passed, 69 total
Snapshots:   0 total
```

Covered areas include:

- anime service;
- anime discovery;
- importer identity parsing;
- importer identity merge policy;
- importer normalization;
- catalog eligibility policy;
- existing authentication and user regression tests.

## Workspace Gates

Validated successfully:

```
pnpm typecheck
pnpm lint
pnpm --filter @anime-platform/api test
pnpm --filter @anime-platform/api build
pnpm --filter @anime-platform/web build
```

Next.js production build successfully includes:

```
/anime/[slug]
/discover
/season
```

## Identity Regression

`canMergeByExternalIdentity()` is used by the importer before an external
identity is allowed to participate in canonical matching.

Reference-only identities are still stored after canonical resolution.

## Catalog Regression

Public anime services enforce INCLUDED-only visibility.

REVIEW and EXCLUDED records remain canonical database records but are not
returned as public anime catalog entries.

## UI Regression

Base UI trigger composition was audited.

Reusable Dialog and Sheet controls, plus the internal `/dev/ui` examples, use
native button elements styled through `buttonVariants` when used as Base UI
render targets.

The audit for:

```
render={<Button ... />}
```

was cleared.

## Local Data Hygiene

Bootstrap and audit data are excluded from Git:

```
/data/import/*.jsonl
/data/import/db-source-anime-map.txt
```

Temporary shell-output artifacts created during debugging were removed.

## Result

Phase 4 validation passed.

The anime database, importer, catalog eligibility boundary, public discovery
API and foundational seasonal page are ready to support Phase 5.
