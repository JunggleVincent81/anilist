# AN-137 — Responsive Homepage Polish & Final Local Quality Audit

## Scope

- Preserve dark minimal anime-first discovery and existing Home/Feed separation.
- Stream the live Featured, Current Season/Airing, and Community sections separately through server React Suspense boundaries with accessible loading placeholders; avoid fabricated anime and reviews.
- Improve minimum touch targets for existing homepage calls to action and section links, maintain keyboard focus states, add compact useful Home footer.
- Preserve AN-132/133 age checks, AN-135 backend spoiler/age filtering, and the AN-130 responsive navigation.
- Add targeted regression coverage and rerun full frontend/backend quality gates prior to any Git checkpoint.

## Out of scope

- No new GraphQL requests, migrations, backend changes or dependency installs.
- No Manga/Music preview before real catalog/API data exist (AN-136 deferred).
- No site-wide Top Rated / Popular / Trending ranking without approved metadata (AN-134 blocked).
- No claims of live GraphQL, browser, accessibility tooling or CI success without independent execution.

## Manual QA still required

- Start backend+frontend and verify Home/Feed navigation with and without login.
- At narrow mobile widths (~320 / 375 px), tablet (~768 px) and desktop (>=1024 px), confirm no horizontal scroll, visible links, readable card wrapping and non-overlapping nav.
- Test slow/unavailable GraphQL server, empty and successful data states; verify Suspense fallbacks are replaced rather than staying forever.
- Keyboard tab from Skip to content through homepage CTA/footer; test reduced-motion preference and touch target usability.
- Check episode times in a browser timezone, spoiler masking and non-adult filtering; never assume NULL is false.
- Review GitHub Actions on the pushed commit, and run live authenticated browser QA before deployment approval.
