# AN-136 — Manga & Anime Music preview availability gate

**Decision: DEFERRED — no preview implemented.**

Phase 11 permits Manga and Anime Music previews **only when actual first-party catalog and API data exist**. Previous local read-only schema audits reported no dedicated Manga, Music, Theme or Artist tables. The existing Anime `MUSIC` enum value and `sourceMaterial = MANGA` do not provide opening/ending/OST catalog data or a separate manga database.

- No fabricated preview cards, sample counts, external images, routes, ratings or playback actions.
- Keep desktop Manga and Music future-category labels disabled per AN-130.
- Reassess only after dedicated domain model, data provenance, permissions, API and frontend routes are implemented and user-approved in later work.
- No schema, import, data or user-facing functionality changed by the AN-136 gate.

This is an explicit **deferral**, not feature completion. AN-134 catalog ranking remains blocked separately.
