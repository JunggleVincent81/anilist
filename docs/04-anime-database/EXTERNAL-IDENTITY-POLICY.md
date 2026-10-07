# External Anime Identity Policy

## Purpose

External provider identifiers are useful for canonical matching, provenance
and future enrichment, but not every provider has equal authority.

`AnimeDataProvider` is an external identity namespace.

It does not mean every provider is an active API integration.

## Canonical Database

The canonical source of truth is:

```text
Anime Platform PostgreSQL database
```

Canonical identifier:

```
Anime.id
```

External IDs must never replace the internal UUID as the application identity.

## Provider Tiers

### Tier A — Canonical Identity Anchors

These providers may participate in automatic canonical matching:

- MAL
- ANILIST
- ANIDB
- KITSU
- ANIME_PLANET
- LIVECHART
- ANN

They are represented by:

```
CANONICAL_IDENTITY_PROVIDERS
```

and checked using:

```
canMergeByExternalIdentity()
```

### Tier B — Media Cross-reference

- TMDB
- IMDB

These IDs may be stored as useful references but must not independently cause
canonical anime records to merge.

### Tier C — Provenance / Generic Reference

- OTHER

`OTHER` may preserve source provenance but must not initiate automatic
canonical merging.

## Merge Rule

```
external identity exists
        ↓
provider allowed for canonical merge?
        ↓
YES → identity may resolve an existing Anime
NO  → identity is reference-only for merge purposes
```

Reference-only IDs are still persisted after the canonical record has been
determined.

## ANN Incident

During Phase 4 validation a severe canonical merge problem was discovered.

Anime News Network URLs have identities such as:

```
https://animenewsnetwork.com/encyclopedia/anime.php?id=36229
```

The original generic fallback discarded the query parameter and generated an
identity equivalent to:

```
OTHER:animenewsnetwork.com/encyclopedia/anime.php
```

Many unrelated ANN records therefore shared the same external identity.

Because the importer trusted matching identities for canonical resolution,
the collision propagated and caused more than twelve thousand raw records to
be associated with one canonical Anime.

## Repair

The repair introduced:

- dedicated `ANN` provider support;
- ANN identity extraction from its `id` query parameter;
- generic OTHER identities that preserve distinguishing URL information;
- regression tests for identity parsing;
- provider-level canonical merge policy;
- a full canonical catalog rebuild.

## Final Audit

After the repair:

```
Raw anime records       38,288
Canonical Anime         38,288
ExternalAnimeId        191,652
```

The external identity count matches the audited unique raw source URL count.

This restored a one-record-per-bootstrap-entry baseline while retaining all
external references.
