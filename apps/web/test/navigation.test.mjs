import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { ANIME_MENU_LINKS, FUTURE_CATEGORIES, isPrimaryNavActive } from "../src/lib/navigation/navigation-policy.ts"
const read = (relative) => readFileSync(new URL(relative, import.meta.url), "utf8")

test("home is active ONLY on / and feed only on /feed paths", () => {
  assert.equal(isPrimaryNavActive("/", "home"), true)
  assert.equal(isPrimaryNavActive("/feed", "home"), false)
  assert.equal(isPrimaryNavActive("/feed", "feed"), true)
  assert.equal(isPrimaryNavActive("/feed/something", "feed"), true)
  assert.equal(isPrimaryNavActive("/discover", "feed"), false)
})
test("anime nav covers existing discovery, seasonal, schedule and detail routes", () => {
  for (const url of ["/discover", "/season", "/schedule", "/anime/test-title"]) {
    assert.equal(isPrimaryNavActive(url, "anime"), true, url)
  }
  assert.equal(isPrimaryNavActive("/feed", "anime"), false)
  assert.deepEqual(ANIME_MENU_LINKS.map((entry) => entry.href), ["/discover", "/season", "/schedule"])
})
test("anime menu destinations really exist", () => {
  for (const item of ANIME_MENU_LINKS) {
    const page = new URL(`../src/app${item.href}/page.tsx`, import.meta.url)
    assert.ok(existsSync(fileURLToPath(page)), `Missing page: ${item.href}`)
  }
})
test("Manga and Music have no fabricated navigation URLs", () => {
  assert.deepEqual([...FUTURE_CATEGORIES], ["Manga", "Music"])
  const policy = read("../src/lib/navigation/navigation-policy.ts")
  assert.doesNotMatch(policy, /href:\s*["']\/(manga|music)/)
  const header = read("../src/components/layout/desktop-header.tsx")
  assert.match(header, /FUTURE_CATEGORIES\.map/)
  assert.match(header, /aria-disabled="true"/)
})
test("desktop header presents Home, Anime, Manga, Music and Feed while preserving account bells", () => {
  const source = read("../src/components/layout/desktop-header.tsx")
  for (const match of ["Home", "Anime", "FUTURE_CATEGORIES", "Feed", 'href="/feed"', 'href="/"', "<NotificationsBell />"]) {
    assert.ok(source.includes(match), `${match} missing`)
  }
  assert.match(source, /aria-label="Anime sections"/)
  assert.match(source, /ANIME_MENU_LINKS\.map/)
  assert.doesNotMatch(source, /href="\/manga"|href="\/music"/)
})
test("mobile navigation keeps five reachable actions, including Feed", () => {
  const source = read("../src/components/layout/mobile-navigation.tsx")
  assert.match(source, /label: "Home"/)
  assert.match(source, /label: "Anime"/)
  assert.match(source, /label: "Feed", href: "\/feed"/)
  assert.match(source, /label: "My List"/)
  assert.match(source, /label: isAuthenticated \? "Profile" : "Sign in"/)
  assert.match(source, /grid-cols-5/)
  assert.match(source, /isAuthenticated \? `\/user\/\$\{user\.username\}\/anime-list` : "\/login"/)
})
test("mobile header retains notifications and search, exposes seasonal/schedule via menu", () => {
  const source = read("../src/components/layout/mobile-header.tsx")
  assert.match(source, /<NotificationsBell \/>/)
  assert.match(source, /aria-label="Search"/)
  assert.match(source, /aria-label="Browse sections"/)
  assert.match(source, /ANIME_MENU_LINKS\.map/)
  assert.doesNotMatch(source, /href="\/manga"|href="\/music"/)
})
test("/feed is a working route; AN-131 still owns homepage migration", () => {
  const home = read("../src/app/page.tsx")
  const feed = read("../src/app/feed/page.tsx")
  assert.match(home, /<ActivityFeed \/>/)
  assert.match(feed, /<ActivityFeed \/>/)
  assert.match(feed, /export default function FeedPage/)
  assert.match(feed, /Feed \| Anime Platform/)
})
