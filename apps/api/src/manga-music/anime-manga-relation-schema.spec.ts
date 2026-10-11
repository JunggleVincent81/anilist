import { readFileSync } from 'node:fs';

const schema = readFileSync('prisma/schema.prisma', 'utf8');
const sql = readFileSync(
  'prisma/migrations/20261011093000_an157a_anime_manga_relations/migration.sql',
  'utf8',
);
function model(name: string) {
  const match = new RegExp('^model ' + name + ' \\{([\\s\\S]*?)^\\}', 'm').exec(schema);
  if (!match) throw Error('Missing model: ' + name);
  return match[1];
}
describe('AN-157A typed anime manga relations', () => {
  it('preserves Anime and MangaWork identities and existing music relation', () => {
    expect(model('Anime')).toContain('musicTracks AnimeMusicTrack[]');
    expect(model('Anime')).toContain('animeMangaRelations AnimeMangaRelation[]');
    expect(model('MangaWork')).toContain('animeMangaRelations AnimeMangaRelation[]');
    expect(model('MangaWork')).toContain('isAdult Boolean?');
  });
  it('requires existing Anime and MangaWork UUID foreign keys', () => {
    const rel = model('AnimeMangaRelation');
    expect(rel).toContain('animeId String @db.Uuid');
    expect(rel).toContain('mangaWorkId String @db.Uuid');
    expect(sql).toContain('"AnimeMangaRelation_animeId_fkey"');
    expect(sql).toContain('"AnimeMangaRelation_mangaWorkId_fkey"');
    expect(sql).toContain('ON DELETE RESTRICT ON UPDATE CASCADE');
  });
  it('uses a typed relation and composite duplicate prevention', () => {
    const rel = model('AnimeMangaRelation');
    expect(rel).toContain('relationType AnimeMangaRelationType');
    expect(rel).toContain('@@unique([animeId, mangaWorkId, relationType])');
    for (const type of ['ADAPTATION', 'SOURCE_MATERIAL', 'SPIN_OFF', 'SIDE_STORY', 'RELATED', 'OTHER']) {
      expect(schema).toContain(type);
    }
  });
  it('requires provenance and preserves private default', () => {
    const rel = model('AnimeMangaRelation');
    expect(rel).toContain('sourceName String @db.VarChar(150)');
    expect(rel).toContain('sourceReference String @db.VarChar(500)');
    expect(rel).toContain('isPublished Boolean @default(false)');
    expect(sql).toContain('"AnimeMangaRelation_sourceName_nonempty_chk"');
    expect(sql).toContain('"AnimeMangaRelation_sourceReference_nonempty_chk"');
  });
  it('adds read indexes without modifying any public API', () => {
    const rel = model('AnimeMangaRelation');
    expect(rel).toContain('@@index([animeId, relationType])');
    expect(rel).toContain('@@index([mangaWorkId, relationType])');
    expect(rel).toContain('@@index([isPublished, relationType])');
  });
});
