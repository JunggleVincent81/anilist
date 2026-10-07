# Anime Domain

## Purpose

Phase 4 establishes the canonical anime domain owned by Anime Platform.

The application does not use external provider IDs as primary identifiers.
Every anime is represented internally by its own UUID.

## Canonical Entity

```text
Anime.id
```

is the canonical identifier used by the application.

External provider IDs are stored separately through `ExternalAnimeId`.

Future user-owned data such as tracking entries, favorites, statistics and
activities must reference the internal `Anime.id`.

## Core Models

The Phase 4 anime domain includes:

- Anime
- AnimeTitle
- ExternalAnimeId
- Genre
- Tag
- Studio
- AnimeStudio
- AnimeGenre
- AnimeTag
- AnimeRelation

## Anime Format

Supported values:

- TV
- MOVIE
- OVA
- ONA
- SPECIAL
- MUSIC
- UNKNOWN

## Release Status

Supported values:

- UPCOMING
- AIRING
- FINISHED
- HIATUS
- CANCELLED
- UNKNOWN

## Season

Supported values:

- WINTER
- SPRING
- SUMMER
- FALL

## Source Material

Supported values include:

- ORIGINAL
- MANGA
- LIGHT_NOVEL
- NOVEL
- WEB_NOVEL
- VISUAL_NOVEL
- GAME
- MULTIMEDIA_PROJECT
- OTHER
- UNKNOWN

## Titles

`Anime` owns the canonical display title.

Alternative titles and synonyms are stored through `AnimeTitle`.

Supported title types:

- ROMAJI
- ENGLISH
- NATIVE
- SYNONYM

The bootstrap dataset does not reliably identify every title as Romaji,
English or Native. The importer therefore does not invent title-language
semantics that are not available from the source.

## Taxonomy

Dataset tags are imported as `Tag`.

They are not automatically promoted into `Genre` because the bootstrap
dataset contains a broader mixed taxonomy.

Studios and producers share the Studio entity while their relationship to an
anime records a role.

Roles:

- ANIMATION
- PRODUCER

## Relations

Anime relations are persisted independently from provider IDs.

The bootstrap dataset exposes related anime references but does not reliably
provide semantic relation types.

For that reason bootstrap relations are imported conservatively as `OTHER`
instead of inventing sequel, prequel or other semantics.

The GraphQL layer may expose directional display forms when a stored relation
contains sufficient information.

## Database Integrity

Phase 4 added database-level protection for important invariants including:

- canonical anime title must not be empty;
- slug must not be empty;
- episodes must be positive when known;
- duration must be positive when known;
- season year must remain within the supported catalog range;
- end date cannot precede start date;
- provider/external ID pairs remain unique.

## Public Visibility

Canonical storage and public catalog visibility are separate concerns.

An anime may exist in the canonical database while not being visible through
the public API.

Public visibility is controlled through catalog eligibility.
