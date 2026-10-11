import { readFileSync } from 'node:fs';

const schema = readFileSync('prisma/schema.prisma', 'utf8');

function section(kind: 'model' | 'enum', name: string): string {
  const regex = new RegExp(
    '^' + kind + '\\s+' + name + '\\s*\\{([\\s\\S]*?)^\\}',
    'm',
  );
  const match = regex.exec(schema);

  if (!match) {
    throw new Error('Missing Prisma ' + kind + ': ' + name);
  }

  return match[1];
}

describe('AN-155 Manga Volume and Chapter Foundation', () => {
  it('preserves MangaWork publication metadata', () => {
    const work = section('model', 'MangaWork');

    expect(work).toContain('isAdult Boolean?');
    expect(work).toContain('isPublished Boolean @default(false)');
    expect(work).toContain('volumes MangaVolume[]');
    expect(work).toContain('chapters MangaChapter[]');
  });

  it('defines stable volume identity per MangaWork', () => {
    const volume = section('model', 'MangaVolume');

    expect(volume).toContain('mangaWorkId String @db.Uuid');
    expect(volume).toContain('@@unique([mangaWorkId, volumeKey])');
    expect(volume).toContain('@@unique([id, mangaWorkId])');
    expect(volume).toContain('onDelete: Restrict');
    expect(volume).toContain('number Int?');
    expect(volume).toContain('isPublished Boolean @default(false)');
  });

  it('allows chapter without volume but requires MangaWork', () => {
    const chapter = section('model', 'MangaChapter');

    expect(chapter).toContain('mangaWorkId String @db.Uuid');
    expect(chapter).toContain('volumeId String? @db.Uuid');
    expect(chapter).toContain('volume MangaVolume?');
    expect(chapter).toContain('@@unique([mangaWorkId, chapterKey])');
    expect(chapter).toContain('onDelete: Restrict');
  });

  it('enforces same-work volume relationship', () => {
    const chapter = section('model', 'MangaChapter');

    expect(chapter).toContain(
      'fields: [volumeId, mangaWorkId], references: [id, mangaWorkId]',
    );
    expect(chapter).toContain('onUpdate: Cascade');
    expect(chapter).toContain('@@index([volumeId, mangaWorkId])');
  });

  it('supports fractional numbering and chapter types', () => {
    const chapter = section('model', 'MangaChapter');
    const types = section('enum', 'MangaChapterType');

    expect(chapter).toContain('number Decimal? @db.Decimal(12, 3)');
    expect(chapter).toContain(
      'chapterType MangaChapterType @default(REGULAR)',
    );
    expect(chapter).toContain('isPublished Boolean @default(false)');
    expect(types).toContain('REGULAR');
    expect(types).toContain('SPECIAL');
    expect(types).toContain('OTHER');
  });
});
