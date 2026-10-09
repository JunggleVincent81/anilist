import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8")
const home = read("../src/app/page.tsx")

test("AN-137 streams each real homepage feature independently", () => {
  assert.match(home, /import \{ Suspense \} from "react"/)
  for (const name of ["FeaturedAnimeSpotlight", "HomeSeasonAndAiring", "HomeCommunityPulseAndReviews"]) {
    assert.equal((home.match(new RegExp(`<${name} \/>`, "g")) || []).length, 1)
    const at = home.indexOf(`<${name} />`)
    assert.ok(at > 0, `Missing ${name} element`)
    assert.match(home.slice(Math.max(0, at - 180), at), /<Suspense fallback=\{<HomeSectionLoading/)
    assert.match(home.slice(at + name.length + 4, at + name.length + 60), /<\/Suspense>/)
  }
  assert.match(home, /export const dynamic = "force-dynamic"/)
})

test("AN-137 loading states are accessible, responsive and motion-safe", () => {
  const loading = read("../src/components/home/home-section-loading.tsx")
  assert.match(loading, /role="status"/)
  assert.match(loading, /aria-label=/)
  assert.match(loading, /aria-hidden="true"/)
  assert.match(loading, /motion-reduce:animate-none/)
  assert.match(loading, /grid-cols-2/)
  assert.doesNotMatch(loading, /Sample Anime|Watch Now|dangerouslySetInnerHTML|<video/)
})

test("AN-137 improves keyboard and touch affordances on real homepage links", () => {
  for (const path of [
    "../src/components/home/featured-anime-spotlight.tsx",
    "../src/components/home/home-season-airing.tsx",
    "../src/components/home/home-community-pulse-and-reviews.tsx",
  ]) {
    assert.match(read(path), /min-h-11/)
    assert.match(read(path), /focus-visible:/)
  }
})

test("AN-137 footer links are valid existing routes, not streaming or placeholder content", () => {
  assert.match(home, /aria-label="Homepage footer"/)
  assert.match(home, /aria-label="Homepage quick links"/)
  for (const path of ["discover", "feed"]) {
    assert.ok(existsSync(fileURLToPath(new URL(`../src/app/${path}/page.tsx`, import.meta.url))))
    assert.match(home, new RegExp(`href="\/${path}"`))
  }
  assert.doesNotMatch(home, /href="\/(music|manga|watch|stream)/)
})

test("AN-137 preserves safety gates and original backend review filter", () => {
  const spotlight = read("../src/lib/home/spotlight-policy.ts")
  const season = read("../src/lib/home/seasonal-airing-policy.ts")
  const backend = read("../../api/src/reviews/reviews.service.ts")
  const feed = read("../src/app/feed/page.tsx")
  assert.match(spotlight, /isAdult/)
  assert.match(season, /isAdult/)
  assert.match(backend, /isAdult: false/)
  assert.match(backend, /isSpoiler: false/)
  assert.match(feed, /<ActivityFeed \/>/)
  assert.doesNotMatch(home, /<ActivityFeed \/>/)
})

test("AN-137 records unresolved Phase 11 gates without claiming completion", () => {
  const an136 = read("../../../docs/11-homepage/AN-136-MANGA-MUSIC-DATA-GATE.md")
  const report = read("../../../docs/99-reports/AN-137-LOCAL-AUDIT-REPORT.md")
  assert.match(an136, /DEFERRED/)
  assert.match(report, /AN-134: BLOCKED/)
  assert.match(report, /manual browser QA: PENDING/)
  assert.match(report, /remote CI: NOT VERIFIED/)
  assert.match(report, /deployment: DEFERRED/)
})
