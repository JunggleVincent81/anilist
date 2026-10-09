import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { previewExcerpt, publicPulsePreview, publicReviewPreview } from "../src/lib/home/community-preview-policy.ts"
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8")
const actor = { username: "fan_123", displayName: "Anime fan" }
const post = (extra = {}) => ({ id: "one", text: "Hello", type: "TEXT", anime: null, actor, createdAt: "2026-10-09T00:00:00Z", ...extra })
const review = (extra = {}) => ({ id: "one", title: "Great", body: "Great anime", isSpoiler: false, score: 8.5, createdAt: "2026-10-09T00:00:00Z", author: actor, anime: { slug: "safe", title: "Safe" }, ...extra })
test("AN-135 pulse renders only human text activities not unknown-age anime links", () => {
  assert.deepEqual(publicPulsePreview([post(), post({ id: "linked", anime: { slug: "unknown", title: "Unknown" } }), post({ id: "auto", type: "REVIEW_PUBLISHED" })]).map(x => x.id), ["one"])
  assert.equal(publicPulsePreview(Array.from({length:10}, (_, i) => post({id: String(i)}))).length, 3)
})
test("AN-135 review preview never includes spoiler-tagged reviews", () => {
  assert.deepEqual(publicReviewPreview([review(),review({id:"spoiler",isSpoiler:true})]).map(x => x.id), ["one"])
  assert.equal(publicReviewPreview(Array.from({length:10}, (_, i) => review({id:String(i)}))).length,3)
})
test("AN-135 excerpts are bounded and React output is untrusted text, not HTML", () => {
  assert.equal(previewExcerpt(" a  b  c "), "a b c")
  assert.ok(previewExcerpt("x".repeat(1000)).length <= 160)
  const jsx = read("../src/components/home/home-community-pulse-and-reviews.tsx")
  assert.doesNotMatch(jsx,/dangerouslySetInnerHTML|<video|autoplay|Watch Now/)
  assert.match(jsx,/Promise\.allSettled/)
  assert.match(jsx,/role="status"/)
  assert.match(jsx,/href="\/feed"/)
})
test("AN-135 real public activity and bounded latest review GraphQL operations", () => {
  const client = read("../src/lib/graphql/home-community.ts")
  const resolver = read("../../api/src/reviews/reviews.resolver.ts")
  const service = read("../../api/src/reviews/reviews.service.ts")
  assert.match(client,/publicActivityFeed\(input: \$input\)/)
  assert.match(client,/recentPublicAnimeReviews/)
  assert.match(client,/perPage: 8/)
  assert.match(resolver,/@Query\(\(\) => \[AnimeReviewType\]\)/)
  assert.match(service,/isSpoiler: false/)
  assert.match(service,/isAdult: false/)
  assert.match(service,/catalogStatus: AnimeCatalogStatus.INCLUDED/)
  assert.match(service,/take: 3/)
})
test("AN-135 homepage integration preserves spotlight/season and dedicated feed", () => {
  const home = read("../src/app/page.tsx")
  const feed = read("../src/app/feed/page.tsx")
  assert.equal((home.match(/<HomeCommunityPulseAndReviews \/>/g) || []).length,1)
  assert.match(home,/<FeaturedAnimeSpotlight \/>/)
  assert.match(home,/<HomeSeasonAndAiring \/>/)
  assert.match(feed,/<ActivityFeed \/>/)
  assert.doesNotMatch(home,/<ActivityFeed/)
})
