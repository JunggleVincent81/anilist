# Catalog Eligibility

## Purpose

Canonical storage is intentionally broader than the public product catalog.

External anime datasets can contain promotional material, music videos,
commercials and other records that are valid database entries but unsuitable
for the main anime tracking catalog.

Phase 4 therefore separates canonical existence from public visibility.

## Status

Each Anime has one catalog status:

- INCLUDED
- REVIEW
- EXCLUDED

Decision source:

- AUTO
- MANUAL

Additional metadata records:

- catalogReason
- catalogRuleVersion

## Policy Version

Current automatic policy:

```text
version 1
```

## Exclusion Examples

Automatic exclusion includes strong non-catalog signals such as:

- commercials;
- visualizer titles;
- lyric videos;
- music-video-making material;
- TV commercials.

## Review Examples

Automatic review includes ambiguous material such as:

- UNKNOWN format;
- MUSIC format;
- promotional content;
- SPECIAL entries tagged as music;
- music-video titles;
- trailers;
- teasers.

Records not matching exclusion or review rules default to INCLUDED.

## Manual Decisions

Manual decisions have higher authority than the automatic classifier.

The automatic classifier must not overwrite catalog decisions whose decision
source is MANUAL.

## Public API Rule

Public anime queries only expose:

```
catalogStatus = INCLUDED
```

This applies to:

- anime by ID;
- anime by slug;
- discovery results;
- related anime exposed through public GraphQL.

REVIEW and EXCLUDED records remain stored for auditability and future curation.

## Final Phase 4 Snapshot

```
INCLUDED   31,270
REVIEW      6,579
EXCLUDED      439
TOTAL      38,288
```

## Example Motivation

Records such as music visualizers demonstrated why importing source data
correctly is not sufficient to determine whether an entry belongs in the
public product catalog.

Catalog eligibility is therefore deliberately separate from importer
normalization.
