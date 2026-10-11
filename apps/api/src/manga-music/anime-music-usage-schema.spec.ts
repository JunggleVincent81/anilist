import { readFileSync } from 'node:fs';

const schema = readFileSync('prisma/schema.prisma', 'utf8');
const sql = readFileSync(
  'prisma/migrations/20261011100000_an157b_anime_music_usage/migration.sql',
  'utf8',
);
function model(name: string) {
  const match = new RegExp('^model ' + name + ' \\{([\\s\\S]*?)^\\}', 'm').exec(schema);
  if (!match) throw Error('Missing model: ' + name);
  return match[1];
}
describe('AN-157B curated anime/music usage', () => {
  it('preserves existing anime music identity and preview fields', () => {
    const song = model('AnimeMusicTrack');
    expect(song).toContain('artistName String @db.VarChar(250)');
    expect(song).toContain('animeId String? @db.Uuid');
    expect(song).toContain('animeMusicUsages AnimeMusicUsage[]');
    expect(model('Anime')).toContain('animeMusicUsages AnimeMusicUsage[]');
  });
  it('enforces real anime and music foreign keys', () => {
    const usage = model('AnimeMusicUsage');
    expect(usage).toContain('animeId String @db.Uuid');
    expect(usage).toContain('animeMusicTrackId String @db.Uuid');
    expect(sql).toContain('"AnimeMusicUsage_animeId_fkey"');
    expect(sql).toContain('"AnimeMusicUsage_animeMusicTrackId_fkey"');
    expect(sql).toContain('ON DELETE RESTRICT ON UPDATE CASCADE');
  });
  it('models multiple usages per song/anime without duplicate keys', () => {
    const usage = model('AnimeMusicUsage');
    expect(usage).toContain('usageKey String @db.VarChar(180)');
    expect(usage).toContain('usageType AnimeMusicCategory');
    expect(usage).toContain('@@unique([animeId, animeMusicTrackId, usageKey])');
  });
  it('validates episodes and curator provenance at database level', () => {
    const usage = model('AnimeMusicUsage');
    expect(usage).toContain('episodeStart Int?');
    expect(usage).toContain('episodeEnd Int?');
    for (const check of [
      'episodeStart_positive', 'episodeEnd_positive', 'episodeRange',
      'usageKey_nonempty', 'sourceName_nonempty', 'sourceReference_nonempty',
    ]) expect(sql).toContain('AnimeMusicUsage_' + check + '_chk');
    expect(usage).toContain('isPublished Boolean @default(false)');
  });
  it('provides indexed curated queries and retains legacy preview policy', () => {
    const usage = model('AnimeMusicUsage');
    expect(usage).toContain('@@index([animeId, usageType])');
    expect(usage).toContain('@@index([animeMusicTrackId, usageType])');
    expect(usage).toContain('@@index([isPublished, usageType])');
    const service = readFileSync('src/manga-music/manga-music.service.ts', 'utf8');
    expect(service).toContain('isPublished: true');
    expect(service).toContain("catalogStatus: 'INCLUDED'");
  });
});
