# Anime Detail

## Purpose

Phase 5 turns `/anime/[slug]` into a real public anime detail experience backed by the canonical anime database from Phase 4.

## Route

```text
/anime/[slug]
```

The page is server-rendered on demand and uses:

```graphql
animeBySlug(slug: String!): Anime
```

Only public `INCLUDED` catalog records are visible.

## Data Contract

The frontend consumes canonical title, alternate titles, description, format, release status, source material, episode count, duration, season/year, dates, artwork, adult flag, genres, tags, studio credits, external references, and related anime.

Null and empty values are valid states and must render gracefully.

## Page Structure

```text
Anime Detail
├── Hero
│   ├── Banner or compact fallback
│   ├── Cover or fallback
│   ├── Canonical title
│   ├── Supporting titles
│   └── Primary metadata
├── Main Content
│   ├── Synopsis
│   ├── Genres & Tags
│   ├── Studios / Producers
│   ├── Release Information
│   ├── Alternative Titles
│   ├── External References
│   └── Related Anime
└── Information Sidebar
    ├── Format
    ├── Status
    ├── Episodes
    ├── Duration
    ├── Season
    └── Source Material
```

## Presentation Rules

- Missing banner uses a compact hero fallback.
- Missing cover uses a neutral placeholder.
- Large tag sets are limited in the initial view.
- Empty sections are omitted.
- Studio credits are grouped into Animation and Producers.
- Obvious mojibake alternate titles are hidden at presentation time only.
- External links are rendered only for valid stored HTTP/HTTPS `sourceUrl` values.
- `OTHER` relations are displayed neutrally as `Related`.
- Related anime are capped at twelve cards initially.
- The UI does not infer missing sequel/prequel semantics.

## Error / SEO / Responsive

Phase 5 includes route-specific loading, not-found, and error states, plus dynamic title/description/Open Graph/Twitter metadata.

The page supports mobile stacking, responsive hero/taxonomy/external references, one-column related cards on narrow screens, and a sticky information sidebar on large screens.

## Deferred

Tracking actions, episode progress, score, favorites, reviews, recommendations, user activity, and airing notifications are deferred to later phases.
