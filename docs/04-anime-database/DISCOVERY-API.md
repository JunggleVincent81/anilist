# Anime Discovery API

## Purpose

Phase 4 exposes the canonical public anime catalog through GraphQL and provides
search, filtering, sorting and pagination for discovery experiences.

## Public Queries

```graphql
anime(id: ID!): Anime
animeBySlug(slug: String!): Anime
animeDiscovery(input: AnimeDiscoveryInput!): AnimeDiscoveryResult
```

Public lookup returns nullable results when an anime does not exist or is not
eligible for the public catalog.

## Public Visibility

All public anime operations are restricted to:

```
catalogStatus = INCLUDED
```

Catalog status itself is not exposed as a public discovery control.

## Search

Search includes the canonical title and stored title variants/synonyms.

Matching is case-insensitive.

## Filters

Discovery supports filters including:

- format;
- release status;
- season;
- season year;
- genres;
- tags;
- studios.

Input sizes and numeric ranges are validated to prevent unbounded public
queries.

## Taxonomy Semantics

Multiple values inside the same taxonomy filter behave as alternatives.

Different taxonomy categories are combined as separate constraints.

## Sorting

Supported Phase 4 sorts:

- TITLE_ASC
- TITLE_DESC
- START_DATE_ASC
- START_DATE_DESC
- SEASON_YEAR_ASC
- SEASON_YEAR_DESC

Deterministic ID ordering is used as a tie-breaker.

## Pagination

Discovery uses page/perPage pagination.

Default:

```
page    = 1
perPage = 20
```

Maximum `perPage`:

```
50
```

The response includes page metadata used by frontend navigation.

## Frontend

The `/discover` page consumes the GraphQL discovery query directly.

Phase 4 frontend support includes:

- real database results;
- search;
- basic filters;
- sorting;
- pagination;
- loading state;
- error state;
- empty state;
- shared AnimeCard rendering.

Missing artwork remains an accepted bootstrap-data limitation rather than
being replaced with invented imagery.
