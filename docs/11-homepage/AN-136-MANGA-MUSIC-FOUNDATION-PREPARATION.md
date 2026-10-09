# AN-136 — Independent Manga & Anime Music catalogue (prepared)

Status: **CODE PREPARED — MIGRATION NOT APPLIED — PUBLIC FEATURE NOT ACCEPTED**.

- Independent `MangaWork` and `AnimeMusicTrack` models, not Anime.sourceMaterial or Anime.format aliases.
- Strict public selection: manga published AND isAdult=false; linked music requires eligible Anime (`isAdult=false`, `INCLUDED`).
- All records default unpublished; no automatic import, seed, assets, audio, streaming or invented catalogue content.
- Source name/reference are required for future manual curation. `isPublished` must only be set after separate content/provenance approval.
- Two read-only GraphQL queries, each capped at twenty records.
- **Before database deployment:** independent migration SQL review, backup, isolated DB rehearsal, rollback rehearsal, explicit user approval. No migration is run by the package.
- **Still required for AN-136 completion:** curate real eligible records, approve publication gate, add/activate manga/music UI and navigation after data availability, authenticated and public runtime smoke tests, browser accessibility, remote CI.
