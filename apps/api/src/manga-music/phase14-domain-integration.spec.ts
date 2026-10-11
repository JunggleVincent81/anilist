import { readFileSync } from 'node:fs';

const schema = readFileSync('prisma/schema.prisma', 'utf8');
const migration = (name: string) => readFileSync(
  'prisma/migrations/' + name + '/migration.sql', 'utf8',
);
const mangaSql = migration('20261011093000_an157a_anime_manga_relations');
const musicSql = migration('20261011100000_an157b_anime_music_usage');
const creditSql = migration('20261011084000_an156_canonical_music_foundation');
function model(name: string): string {
  const match = new RegExp('^model ' + name + ' \\{([\\s\\S]*?)^\\}', 'm').exec(schema);
  if (!match) throw new Error('Missing model ' + name);
  return match[1];
}

describe('AN-158 Phase 14 additive domain integration', () => {
  it('retains existing anime, manga, song and public identifiers', () => {
    expect(model('Anime')).toContain('musicTracks AnimeMusicTrack[]');
    expect(model('MangaWork')).toContain('slug String @unique');
    expect(model('AnimeMusicTrack')).toContain('artistName String @db.VarChar(250)');
    expect(model('AnimeMusicTrack')).toContain('animeId String? @db.Uuid');
  });
  it('retains episode and manga structural foundations', () => {
    expect(model('AnimeEpisode')).toContain('animeId String @db.Uuid');
    expect(model('MangaVolume')).toContain('mangaWorkId String @db.Uuid');
    expect(model('MangaChapter')).toContain('volumeId String? @db.Uuid');
  });
  it('integrates canonical artist recording release and unified credit', () => {
    for (const name of ['MusicArtist', 'MusicRecording', 'MusicRelease', 'MusicReleaseTrack', 'MusicCredit']) {
      expect(schema).toContain('model ' + name + ' {');
    }
    expect(model('MusicRecording')).toContain('animeMusicTrackId String? @db.Uuid');
    expect(model('MusicCredit')).toContain('artistId String @db.Uuid');
    expect(creditSql).toContain('num_nonnulls');
  });
  it('keeps typed anime manga relations curated, indexed and unpublished by default', () => {
    const m = model('AnimeMangaRelation');
    expect(m).toContain('relationType AnimeMangaRelationType');
    expect(m).toContain('@@unique([animeId, mangaWorkId, relationType])');
    expect(m).toContain('isPublished Boolean @default(false)');
    expect(mangaSql).toContain('AnimeMangaRelation_animeId_fkey');
    expect(mangaSql).toContain('AnimeMangaRelation_mangaWorkId_fkey');
  });
  it('supports many-to-many anime song use without rewriting legacy song references', () => {
    const u = model('AnimeMusicUsage');
    expect(u).toContain('animeId String @db.Uuid');
    expect(u).toContain('animeMusicTrackId String @db.Uuid');
    expect(u).toContain('@@unique([animeId, animeMusicTrackId, usageKey])');
    expect(u).toContain('isPublished Boolean @default(false)');
    expect(musicSql).toContain('AnimeMusicUsage_animeId_fkey');
    expect(musicSql).toContain('AnimeMusicUsage_animeMusicTrackId_fkey');
  });
  it('preserves existing server-side eligibility and public GraphQL shape', () => {
    const service = readFileSync('src/manga-music/manga-music.service.ts', 'utf8');
    const gql = readFileSync('src/manga-music/manga-music.graphql.ts', 'utf8');
    expect(service).toContain('isPublished: true');
    expect(service).toContain('isAdult: false');
    expect(service).toContain("catalogStatus: 'INCLUDED'");
    expect(gql).toContain('PublicAnimeMusicTrack');
    expect(gql).toContain('artistName!: string');
  });
});
