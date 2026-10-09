import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import {
  eligibleSpotlightDetail,
  safeSpotlightImage,
  spotlightCandidates,
  spotlightExcerpt,
} from "../src/lib/home/spotlight-policy.ts"

const read = (name) => readFileSync(new URL(name, import.meta.url), "utf8")
const summary = (title, status, coverImageUrl = null) => ({
  id: title, slug: title.toLowerCase(), title, status, coverImageUrl,
  season: "FALL", seasonYear: 2026, format: "TV", episodes: 12,
})
const detail = (values = {}) => ({ ...summary("Sample", "AIRING"), isAdult: false, ...values })

test("AN-132 selects airing candidates first, then usable cover, deterministically", () => {
  const found = spotlightCandidates([
    summary("Zeta", "UPCOMING", "https://example.com/z.jpg"),
    summary("Bravo", "AIRING"),
    summary("Alpha", "AIRING", "https://example.com/a.jpg"),
  ])
  assert.deepEqual(found.map((x) => x.title), ["Alpha", "Bravo", "Zeta"])
  assert.equal(spotlightCandidates([summary("Invalid", "AIRING", "javascript:alert(1)")])[0].title, "Invalid")
  assert.equal(spotlightCandidates(Array.from({ length: 20 }, (_, n) => summary(String(n), "AIRING"))).length, 8)
})

test("AN-132 excludes adult, unknown, mismatched-season and missing-detail titles", () => {
  assert.equal(eligibleSpotlightDetail(detail(), "FALL", 2026), true)
  assert.equal(eligibleSpotlightDetail(detail({ isAdult: true }), "FALL", 2026), false)
  assert.equal(eligibleSpotlightDetail(detail({ isAdult: null }), "FALL", 2026), false)
  assert.equal(eligibleSpotlightDetail(detail({ season: "SUMMER" }), "FALL", 2026), false)
  assert.equal(eligibleSpotlightDetail(detail({ seasonYear: 2025 }), "FALL", 2026), false)
  assert.equal(eligibleSpotlightDetail(detail({ slug: "" }), "FALL", 2026), false)
  assert.equal(eligibleSpotlightDetail(null, "FALL", 2026), false)
})

test("AN-132 accepts only http(s) poster URLs", () => {
  assert.equal(safeSpotlightImage("javascript:alert(1)"), null)
  assert.equal(safeSpotlightImage("data:image/svg+xml,bad"), null)
  assert.equal(safeSpotlightImage("/relative.png"), null)
  assert.equal(safeSpotlightImage(null), null)
  assert.equal(safeSpotlightImage("https://example.com/cover.jpg"), "https://example.com/cover.jpg")
})

test("AN-132 removes markup and caps description length", () => {
  assert.equal(spotlightExcerpt("<p>Hello <b>anime</b> &amp; fans</p>"), "Hello anime & fans")
  assert.equal(spotlightExcerpt("<p></p>"), null)
  assert.ok(spotlightExcerpt("x".repeat(400)).length <= 185)
})

test("AN-132 uses the real catalog GraphQL clients, not hardcoded demo anime", () => {
  const component = read("../src/components/home/featured-anime-spotlight.tsx")
  assert.match(component, /discoverAnime\(/)
  assert.match(component, /getAnimeBySlug\(/)
  assert.match(component, /getCurrentAnimeSeason\(/)
  assert.match(component, /eligibleSpotlightDetail\(/)
  assert.match(component, /state: "unavailable"/)
  assert.match(component, /state: "empty"/)
  assert.match(component, /sort: "TITLE_ASC"/)
  assert.doesNotMatch(component, /Watch Now|<video|autoplay|dangerouslySetInnerHTML/)
})

test("AN-132 keeps one compact server-rendered hero and separate feed", () => {
  const home = read("../src/app/page.tsx")
  const component = read("../src/components/home/featured-anime-spotlight.tsx")
  const feed = read("../src/app/feed/page.tsx")
  assert.match(home, /export const dynamic = "force-dynamic"/)
  assert.match(home, /<FeaturedAnimeSpotlight \/>/)
  assert.equal((home.match(/<FeaturedAnimeSpotlight \/>/g) || []).length, 1)
  // AN-135 extracted this section: verify both placement and visible content.
  const community = read("../src/components/home/home-community-pulse-and-reviews.tsx")
  assert.match(home, /<HomeCommunityPulseAndReviews \/>/)
  assert.match(community, /From the community/)
  assert.match(community, /href="\/feed"/)
  assert.match(feed, /<ActivityFeed \/>/)
  assert.doesNotMatch(home, /<ActivityFeed \/>/)
  assert.match(component, /View details/)
  assert.match(component, /Manage list/)
  assert.match(component, /href="\/season"/)
  assert.match(component, /href="\/discover"/)
})
