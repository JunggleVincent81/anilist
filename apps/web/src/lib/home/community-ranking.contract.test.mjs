import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
const service = readFileSync(new URL('../../../../api/src/anime/anime-community-ranking.service.ts', import.meta.url), 'utf8')
const view = readFileSync(new URL('../../components/home/home-community-ranking.tsx', import.meta.url), 'utf8')
const graphql = readFileSync(new URL('../graphql/home-ranking.ts', import.meta.url), 'utf8')
test('ranking excludes adult and unknown-age anime in aggregation and title reads', () => {
  assert.match(service, /isAdult: false/)
  assert.match(service, /catalogStatus: AnimeCatalogStatus.INCLUDED/)
  assert.match(service, /MIN_SCORED_REVIEWS = 3/)
  assert.match(service, /communityWeightedScore/)
})
test('community weighted score is labeled honestly and returned by GraphQL', () => {
  assert.match(view, /weighted community score/)
  assert.match(view, /Raw community average/)
  assert.match(view, /Not an official or external ranking/)
  assert.match(graphql, /weightedScore/)
  assert.doesNotMatch(view, /coverImageUrl|<img|<Image/)
})
