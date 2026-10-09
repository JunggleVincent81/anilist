import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')
test('catalogue queries only invoke their declared public preview fields', () => {
  const code = read('../graphql/manga-music.ts')
  assert.match(code, /publicMangaPreview \{ id slug title synopsis sourceName sourceReference \}/)
  assert.match(code, /publicAnimeMusicPreview \{ id slug title artistName category animeSlug sourceName sourceReference \}/)
})
test('manga and music routes include explicit empty, error and loading states', () => {
  for (const name of ['manga', 'music']) {
    assert.match(read(`../../app/${name}/page.tsx`), /length === 0/)
    assert.match(read(`../../app/${name}/error.tsx`), /Catalogue unavailable/)
    assert.match(read(`../../app/${name}/loading.tsx`), /Loading catalogue/)
  }
})
