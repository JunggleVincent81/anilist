import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { notificationHref } from "../src/lib/graphql/notifications.contract.ts"
import { isPrimaryNavActive } from "../src/lib/navigation/navigation-policy.ts"

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8")

test("AN-131: root is a discovery landing, not a duplicate activity feed", () => {
  const home = read("../src/app/page.tsx")
  assert.match(home, /export default function HomePage/)
  assert.doesNotMatch(home, /ActivityFeed|fetchActivityFeed|postTextActivity/)
  assert.match(home, /<FeaturedAnimeSpotlight \/>/)
  assert.match(home, /From the community/)
  assert.match(home, /title: "Home \| Anime Platform"/)
})

test("AN-131: original ActivityFeed remains at /feed", () => {
  const feed = read("../src/app/feed/page.tsx")
  const impl = read("../src/components/social/activity-feed.tsx")
  assert.match(feed, /<ActivityFeed \/>/)
  assert.match(feed, /Feed \| Anime Platform/)
  for (const capability of ["postTextActivity", "setActivityLike", "postActivityReply", "fetchActivityReplies", "Following", "Everyone"]) {
    assert.ok(impl.includes(capability), `Social feed lost ${capability}`)
  }
})

test("AN-131: only links to real existing anime and social routes", () => {
  const home = read("../src/app/page.tsx")
  for (const path of ["discover", "season", "schedule", "feed"]) {
    const page = fileURLToPath(new URL(`../src/app/${path}/page.tsx`, import.meta.url))
    assert.ok(existsSync(page), `Route missing: /${path}`)
    assert.match(home, new RegExp(`href: "\\/${path}"|href="\\/${path}"`))
  }
  assert.doesNotMatch(home, /href="\/(manga|music|watch|stream)/)
})

test("AN-131: notifications for likes/replies open Feed; follows open actor profile", () => {
  assert.equal(notificationHref("FOLLOW", "anime fan"), "/user/anime%20fan")
  assert.equal(notificationHref("ACTIVITY_LIKE", "tester"), "/feed")
  assert.equal(notificationHref("ACTIVITY_REPLY", "tester"), "/feed")
})

test("AN-131: Home and Feed are separate nav destinations", () => {
  assert.equal(isPrimaryNavActive("/", "home"), true)
  assert.equal(isPrimaryNavActive("/feed", "home"), false)
  assert.equal(isPrimaryNavActive("/", "feed"), false)
  assert.equal(isPrimaryNavActive("/feed", "feed"), true)
  const desktop = read("../src/components/layout/desktop-header.tsx")
  const mobile = read("../src/components/layout/mobile-navigation.tsx")
  assert.match(desktop, /href="\/feed"/)
  assert.match(mobile, /label: "Feed", href: "\/feed"/)
})

test("AN-131: transition home retains light, responsive, accessible structure", () => {
  const home = read("../src/app/page.tsx")
  assert.match(home, /max-w-6xl/)
  assert.match(home, /md:grid-cols-3/)
  assert.match(read("../src/components/home/featured-anime-spotlight.tsx"), /aria-labelledby="home-intro-title"/)
  assert.match(home, /aria-labelledby="anime-paths-title"/)
  assert.match(home, /aria-labelledby="home-community-title"/)
  assert.doesNotMatch(home, /<img|<video|autoplay|Watch Now/)
})
