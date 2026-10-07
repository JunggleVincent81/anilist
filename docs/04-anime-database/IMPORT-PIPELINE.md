# Anime Import Pipeline

## Purpose

Phase 4 introduces a repeatable bootstrap pipeline for populating the
canonical anime database from the local anime-offline-database dataset.

The dataset is bootstrap material, not the application's canonical database.

## Source

Local import path:

```text
data/import/anime-offline-database.jsonl
```

The local dataset is intentionally ignored by Git.

## Pipeline

```
JSONL source
    ↓
stream reader
    ↓
normalization
    ↓
external identity parsing
    ↓
canonical identity resolution
    ↓
Anime create / enrichment
    ↓
external IDs
    ↓
titles / synonyms
    ↓
tags
    ↓
studios / producers
    ↓
relation second pass
    ↓
catalog classification
```

## Streaming

The importer streams JSONL records instead of loading the full dataset into
memory.

This keeps the import suitable for a catalog containing tens of thousands of
records.

## Normalization

The bootstrap fields are mapped conservatively.

Important mappings include:

```
title       → Anime.title
type        → Anime.format
episodes    → Anime.episodes
status      → Anime.status
animeSeason → Anime.season / Anime.seasonYear
duration    → Anime.durationMinutes
synonyms    → AnimeTitle(SYNONYM)
sources     → ExternalAnimeId
studios     → AnimeStudio(ANIMATION)
producers   → AnimeStudio(PRODUCER)
tags        → Tag
relatedAnime→ AnimeRelation
```

Unknown or unavailable values remain unknown/null instead of being invented.

## Canonical Merge

Canonical merge is based only on providers approved as canonical identity
anchors.

Reference-only identities remain stored but cannot independently cause two
raw records to become one canonical Anime.

See:

```
EXTERNAL-IDENTITY-POLICY.md
```

## Enrichment

When an incoming record resolves to an existing canonical Anime, the importer
may enrich fields that are currently unknown.

Existing meaningful data is preferred over weaker incoming unknown values.

Different incoming titles may be preserved as synonyms rather than silently
discarded.

## Slugs

Slugs are created from the canonical title.

When a slug collision occurs, external identity information or a deterministic
hash is used to produce a unique slug.

## Relations

Relations are imported in a second pass so target anime have already been
resolved.

The bootstrap dataset does not provide relation semantics with sufficient
confidence, therefore imported relation type defaults to `OTHER`.

## Local Commands

Import:

```
pnpm --filter @anime-platform/api anime:import -- \
  --file ../../data/import/anime-offline-database.jsonl
```

Catalog classification:

```
pnpm --filter @anime-platform/api anime:catalog-classify
```

## Local Artifacts

The following files are local-only and excluded from Git:

```
data/import/*.jsonl
data/import/db-source-anime-map.txt
```

`db-source-anime-map.txt` was used during the canonical merge audit and is not
part of production source code.
