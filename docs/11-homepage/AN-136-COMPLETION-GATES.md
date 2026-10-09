# AN-136 — Completion gates after foundation a8455fd

This patch provides `/manga` and `/music` server-rendered catalogue previews, data-source attributions, graceful empty/loading/error states, typed GraphQL client queries and frontend contract tests. It does **not** contain invented catalogue records, a publication workflow, or audio streaming. Navigation remains deliberately disabled until a real reviewed catalogue is published.

## Pending mandatory gates

1. **Database**: isolated migration replay against a disposable PostgreSQL database matching the target, SQL diff and schema verification, then **separate user approval** before modifying active DB. Do not run `migrate deploy`, `migrate dev`, `db push` or backfill without approval.
2. **Content**: supply real source-attributed manga and music records; verify rights and attribution, classification (adult unknown must remain hidden), identity uniqueness and human publication approval. No invented seed.
3. **Runtime**: after approved DB activation, test GraphQL `publicMangaPreview` and `publicAnimeMusicPreview` on actual API port (normally 4000). Verify `/manga` and `/music` on Next.js port 3000 in empty state and after approved publication. Build alone is not live acceptance.
4. **Security**: verify no mutation or admin route allows unpublished rows to appear; add authentication, editorial review, moderation, and audit trail before opening public editing or automatic publication.
5. **Phase 11 homepage**: do not enable Manga/Music primary nav until adequate reviewed data exists. Current frontend pages are accessible by their URLs, but not advertised as active primary modules.

Status: **Frontend prepared — acceptance conditional on operational gates above.**
