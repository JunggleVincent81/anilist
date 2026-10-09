import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { ANIME_MENU_LINKS, CATALOG_MENU_LINKS, isPrimaryNavActive } from "../src/lib/navigation/navigation-policy.ts"
const read = (relative) => readFileSync(new URL(relative, import.meta.url), "utf8")

test("primary navigation matches active routes", () => {
  assert.equal(isPrimaryNavActive("/", "home"), true)
  assert.equal(isPrimaryNavActive("/feed", "home"), false)
  assert.equal(isPrimaryNavActive("/feed", "feed"), true)
  assert.equal(isPrimaryNavActive("/feed/activity", "feed"), true)
  for (const section of ["manga", "music"]) {
    assert.equal(isPrimaryNavActive(`/${section}`, section), true)
    assert.equal(isPrimaryNavActive(`/${section}/detail`, section), true)
    assert.equal(isPrimaryNavActive("/", section), false)
  }
})
test("anime nav points only to available anime routes", () => {
  for (const url of ["/discover", "/season", "/schedule", "/anime/test-title"]) {
    assert.equal(isPrimaryNavActive(url, "anime"), true, url)
  }
  assert.deepEqual(ANIME_MENU_LINKS.map((item) => item.href), ["/discover", "/season", "/schedule"])
  for (const item of ANIME_MENU_LINKS) {
    assert.ok(existsSync(fileURLToPath(new URL(`../src/app${item.href}/page.tsx`, import.meta.url))))
  }
})
test("Manga and Music have real enabled routes on desktop and mobile", () => {
  assert.deepEqual(CATALOG_MENU_LINKS.map((item) => item.href), ["/manga", "/music"])
  for (const item of CATALOG_MENU_LINKS) {
    assert.ok(existsSync(fileURLToPath(new URL(`../src/app${item.href}/page.tsx`, import.meta.url))))
  }
  const desktop = read("../src/components/layout/desktop-header.tsx")
  const mobile = read("../src/components/layout/mobile-header.tsx")
  assert.match(desktop, /CATALOG_MENU_LINKS\.map/)
  assert.match(mobile, /CATALOG_MENU_LINKS\.map/)
  assert.doesNotMatch(desktop, /FUTURE_CATEGORIES|aria-disabled="true"/)
  assert.doesNotMatch(mobile, /FUTURE_CATEGORIES|coming later/)
  assert.match(desktop, /<NotificationsBell \/>/)
  assert.match(mobile, /<NotificationsBell \/>/)
})
test("mobile bottom navigation keeps five actions, including Feed", () => {
  const source = read("../src/components/layout/mobile-navigation.tsx")
  for (const fragment of ['label: "Home"', 'label: "Anime"', 'label: "Feed", href: "/feed"', 'label: "My List"', 'label: isAuthenticated ? "Profile" : "Sign in"', 'grid-cols-5']) {
    assert.ok(source.includes(fragment), fragment)
  }
})
test("ActivityFeed remains exclusively on /feed", () => {
  const home = read("../src/app/page.tsx")
  const feed = read("../src/app/feed/page.tsx")
  assert.doesNotMatch(home, /<ActivityFeed \/>/)
  assert.match(feed, /<ActivityFeed \/>/)
  assert.match(feed, /export default function FeedPage/)
})
