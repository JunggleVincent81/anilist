import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import {
  ANIME_REVIEWS_QUERY,
  CREATE_ANIME_REVIEW_MUTATION,
  DELETE_MY_ANIME_REVIEW_MUTATION,
  REVIEW_PAGE_SIZE,
  REVIEW_SCORE_CHOICES,
  UPDATE_ANIME_REVIEW_MUTATION,
  USER_REVIEWS_QUERY,
  cleanReviewDraft,
  normalizeReviewPage,
  reviewScoreLabel,
} from "../src/lib/graphql/reviews.contract.ts"

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8")
const valid = { title: "  Nice anime  ", body: "   A thoughtful review   ", score: 8.5, isSpoiler: true }

test("review validation trims title and body while preserving score/spoiler", () => {
  assert.deepEqual(cleanReviewDraft(valid), { title: "Nice anime", body: "A thoughtful review", score: 8.5, isSpoiler: true })
  assert.equal(cleanReviewDraft({ ...valid, title: " " }).title, null)
})
test("review body is mandatory and limited to 10000 characters", () => {
  for (const body of ["", "  ", "x".repeat(10001)]) assert.throws(() => cleanReviewDraft({ ...valid, body }))
  assert.equal(cleanReviewDraft({ ...valid, body: "x".repeat(10000) }).body.length, 10000)
})
test("title max length enforced", () => {
  assert.throws(() => cleanReviewDraft({ ...valid, title: "x".repeat(151) }))
  assert.equal(cleanReviewDraft({ ...valid, title: "x".repeat(150) }).title?.length, 150)
})
test("score is optional and limited to half steps 1-10", () => {
  assert.equal(REVIEW_SCORE_CHOICES.length, 19)
  for (const score of [0, 10.5, 8.25, Infinity, NaN]) assert.throws(() => cleanReviewDraft({ ...valid, score }))
  assert.equal(cleanReviewDraft({ ...valid, score: null }).score, null)
  assert.equal(cleanReviewDraft({ ...valid, score: 10 }).score, 10)
  assert.equal(reviewScoreLabel(7.5), "7.5 / 10")
})
test("pagination normalization and capped server page size", () => {
  assert.equal(REVIEW_PAGE_SIZE, 10)
  for (const value of [0, -1, NaN, 2.5, Infinity]) assert.equal(normalizeReviewPage(value), 1)
  assert.equal(normalizeReviewPage(8), 8)
})
test("read operations match backend fields and use variables", () => {
  assert.match(ANIME_REVIEWS_QUERY, /animeReviews\(animeId: \$animeId, input: \$input\)/)
  assert.match(ANIME_REVIEWS_QUERY, /animeReviewStats\(animeId: \$animeId\)/)
  assert.match(ANIME_REVIEWS_QUERY, /isSpoiler/)
  assert.match(USER_REVIEWS_QUERY, /userReviews\(username: \$username, input: \$input\)/)
})
test("create/update/delete mutations use argument variables", () => {
  assert.match(CREATE_ANIME_REVIEW_MUTATION, /createAnimeReview\(input: \$input\)/)
  assert.match(UPDATE_ANIME_REVIEW_MUTATION, /updateAnimeReview\(input: \$input\)/)
  assert.match(DELETE_MY_ANIME_REVIEW_MUTATION, /deleteMyAnimeReview\(id: \$id\)/)
  const api = read("../src/lib/graphql/reviews.ts")
  assert.match(api, /graphqlRequest/)
  assert.match(api, /cleanReviewDraft\(input\)/)
})
test("anime page integrates review UI without replacing existing detail", () => {
  const page = read("../src/app/anime/[slug]/page.tsx")
  assert.match(page, /<AnimeReviews animeId=\{anime.id\} animeTitle=\{anime.title\}/)
  assert.match(page, /<AnimeDetailHero/)
  assert.match(page, /<AnimeRelations/)
})
test("review UI hides spoilers until explicit reveal, gates editing and login", () => {
  const code = read("../src/components/anime/anime-reviews.tsx")
  assert.match(code, /const hidden = item.isSpoiler && !spoilerVisible/)
  assert.match(code, /Reveal review/)
  assert.match(code, /aria-expanded=\{false\}/)
  assert.match(code, /review.userId !== user.id/)
  assert.match(code, /window.confirm/)
  assert.match(code, /href="\/login"/)
  assert.match(code, /useAuth\(\)/)
})
