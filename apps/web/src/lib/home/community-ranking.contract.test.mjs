import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
const service = readFileSync(new URL('../../../../api/src/anime/anime-community-ranking.service.ts', import.meta.url), 'utf8')
const view = readFileSync(new URL('../../components/home/home-community-ranking.tsx', import.meta.url), 'utf8')
test('ranking strictly excludes unknown and adult anime in both reads', () => {
  assert.equal((service.match(/isAdult: false/g) ?? []).length, 2)
  assert.match(service, /catalogStatus: AnimeCatalogStatus.INCLUDED/)
  assert.match(service, /MIN_SCORED_REVIEWS = 3/)
})
test('ranking does not present misleading popularity or external metadata', () => {
  assert.match(view, /Community-rated anime/)
  assert.match(view, /scored reviews/)
  assert.doesNotMatch(view, /coverImageUrl|<img|<Image/)
})
