import { readFileSync } from 'node:fs';

const schema = readFileSync(
  'prisma/schema.prisma',
  'utf8',
);

function modelBody(name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = schema.match(
    new RegExp('model\\s+' + escaped + '\\s*\\{([\\s\\S]*?)\\n\\}'),
  );

  if (!match) {
    throw new Error('Missing Prisma model: ' + name);
  }

  return match[1];
}

describe('AN-154 AnimeEpisode schema contract', () => {
  it('preserves existing Anime total episode metadata', () => {
    const anime = modelBody('Anime');
    expect(anime).toMatch(/\bepisodes\s+Int\?/);
    expect(anime).toMatch(/\bdurationMinutes\s+Int\?/);
    expect(anime).toMatch(/episodeRecords AnimeEpisode\[\]/);
  });

  it('defines episode identity and restrictive relation', () => {
    const episode = modelBody('AnimeEpisode');
    expect(episode).toMatch(/id String @id @default\(uuid\(\)\)/);
    expect(episode).toMatch(/animeId String @db\.Uuid/);
    expect(episode).toContain('onDelete: Restrict');
    expect(episode).toContain('@@unique([animeId, episodeKey])');
    expect(episode).toContain('@@index([animeId, episodeType, number])');
  });

  it('keeps individual episode metadata optional', () => {
    const episode = modelBody('AnimeEpisode');
    expect(episode).toMatch(/number Int\?/);
    expect(episode).toMatch(/title String\?/);
    expect(episode).toMatch(/durationMinutes Int\?/);
    expect(episode).toMatch(/airDate DateTime\?/);
    expect(episode).toMatch(/sourceReference String\?/);
  });

  it('preserves numeric user tracking and canonical totals', () => {
    const tracking = modelBody('AnimeListEntry');
    expect(tracking).toContain('progressEpisodes Int @default(0)');
    expect(tracking).toContain('@@unique([userId, animeId])');
  });
});
