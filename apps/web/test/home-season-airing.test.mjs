import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import {
  airingCandidateWindow, eligiblePublicPreview, localDayKey,
  seasonalCandidateWindow, todayAiringItems,
} from "../src/lib/home/seasonal-airing-policy.ts"

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8")
const summary = (slug, extra = {}) => ({
  id: slug, slug, title: slug, season: "FALL", seasonYear: 2026,
  format: "TV", status: "AIRING", episodes: 12, coverImageUrl: null, ...extra,
})
const item = (slug, airingAt, episode = 2) => ({ anime: summary(slug), airingAt, episode })

test("AN-133 limits seasonal preview to the requested season and bounded candidate window", () => {
  assert.deepEqual(seasonalCandidateWindow([
    summary("a"), summary("b", {season: "SUMMER"}), summary("c", {seasonYear: 2025}),
  ], "FALL", 2026).map((x) => x.slug), ["a"])
  assert.equal(seasonalCandidateWindow(Array.from({length:50}, (_,n)=>summary(`a${n}`)),"FALL",2026).length,8)
})
test("AN-133 never displays adult/unknown or mismatched detail records", () => {
  const base = summary("safe")
  assert.equal(eligiblePublicPreview(base, {...base, isAdult:false}), true)
  assert.equal(eligiblePublicPreview(base, {...base, isAdult:true}), false)
  assert.equal(eligiblePublicPreview(base, {...base, isAdult:null}), false)
  assert.equal(eligiblePublicPreview(base, {...base, id:"other", isAdult:false}), false)
  assert.equal(eligiblePublicPreview(base, null), false)
})
test("AN-133 upcoming candidates validate timestamps, episode numbers and limit requests", () => {
  const now = Date.parse("2026-10-09T00:00:00Z")
  const choices = airingCandidateWindow([
    item("later", "2026-10-10T10:00:00Z"),
    item("early", "2026-10-09T10:00:00Z"),
    item("old", "2026-10-08T10:00:00Z"),
    item("bad", "not-a-date"),
    item("zero", "2026-10-10T10:00:00Z", 0),
  ], now)
  assert.deepEqual(choices.map((x)=>x.anime.slug), ["early", "later"])
  assert.equal(airingCandidateWindow(Array.from({length: 40}, (_, n)=>item(`s${n}`, "2026-10-10T10:00:00Z")),now).length,8)
})
test("AN-133 UTC-day logic does not pretend tomorrow's show is today", () => {
  const now=new Date("2026-10-09T07:00:00Z")
  assert.equal(localDayKey(now,false), "2026-10-09")
  assert.deepEqual(todayAiringItems([
    item("today", "2026-10-09T10:00:00Z"),
    item("tomorrow", "2026-10-10T00:20:00Z"),
  ],now,false).map(x=>x.anime.slug),["today"])
})
test("AN-133 uses real public discovery, schedule, and adult detail checks", () => {
  const source=read("../src/components/home/home-season-airing.tsx")
  assert.match(source,/discoverAnime\(/)
  assert.match(source,/getAiringSchedule\(3\)/)
  assert.match(source,/getAnimeBySlug\(/)
  assert.match(source,/eligiblePublicPreview\(/)
  assert.match(source,/Promise\.allSettled\(/)
  assert.match(source,/unavailable/)
  assert.match(source,/empty/)
  assert.doesNotMatch(source,/Watch Now|<video|autoplay|dangerouslySetInnerHTML/)
})
test("AN-133 integrates compact sections only on Home and preserves existing Feed", () => {
  const home=read("../src/app/page.tsx")
  const feed=read("../src/app/feed/page.tsx")
  const source=read("../src/components/home/home-season-airing.tsx")
  const client=read("../src/components/home/today-airing-list.tsx")
  assert.equal((home.match(/<HomeSeasonAndAiring \/>/g)||[]).length,1)
  assert.match(home,/<FeaturedAnimeSpotlight \/>/)
  assert.match(home,/<HomeCommunityPulseAndReviews \/>/)
  assert.match(feed,/<ActivityFeed \/>/)
  assert.doesNotMatch(home,/<ActivityFeed/)
  assert.match(source,/sm:grid-cols-4/)
  assert.match(source,/lg:grid-cols-/)
  assert.match(client,/useSyncExternalStore/)
  assert.match(client,/TodayAiringList/)
  assert.match(client,/Your local time/)
})
