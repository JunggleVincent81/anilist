import { readFileSync } from 'node:fs';

const schema = readFileSync('prisma/schema.prisma', 'utf8');
const migration = readFileSync(
  'prisma/migrations/20261011084000_an156_canonical_music_foundation/migration.sql',
  'utf8',
);
function section(name: string): string {
  const match = new RegExp('^model ' + name + ' \\{([\\s\\S]*?)^\\}', 'm').exec(schema);
  if (!match) throw new Error('Missing model: ' + name);
  return match[1];
}

describe('AN-156 additive canonical music foundation', () => {
  it('preserves legacy AnimeMusicTrack metadata', () => {
    const song = section('AnimeMusicTrack');
    expect(song).toContain('artistName String @db.VarChar(250)');
    expect(song).toContain('isPublished Boolean @default(false)');
    expect(song).toContain('recordings MusicRecording[]');
  });
  it('identifies artists using keys, not names', () => {
    const artist = section('MusicArtist');
    expect(artist).toContain('artistKey String @unique');
    expect(artist).not.toContain('displayName String @unique');
  });
  it('permits recordings without song association', () => {
    const recording = section('MusicRecording');
    expect(recording).toContain('animeMusicTrackId String? @db.Uuid');
    expect(recording).toContain('recordingKey String @unique');
  });
  it('allows recording reuse across release track rows', () => {
    const track = section('MusicReleaseTrack');
    expect(track).toContain('@@unique([releaseId, discNumber, trackNumber])');
    expect(track).toContain('recordingId String @db.Uuid');
    expect(migration).toContain('"MusicReleaseTrack_disc_positive_chk"');
    expect(migration).toContain('"MusicReleaseTrack_track_positive_chk"');
  });
  it('uses unified credit with four typed targets', () => {
    const credit = section('MusicCredit');
    for (const field of ['animeMusicTrackId', 'recordingId', 'releaseId', 'releaseTrackId']) {
      expect(credit).toContain(`${field} String? @db.Uuid`);
    }
    expect(migration).toContain('"MusicCredit_exactly_one_target_chk"');
    expect(migration).toContain('num_nonnulls(');
  });
  it('enforces provenance and defaults new records to unpublished', () => {
    for (const name of ['MusicArtist', 'MusicRecording', 'MusicRelease', 'MusicCredit']) {
      expect(section(name)).toContain('sourceReference String @db.VarChar(500)');
      expect(section(name)).toContain('isPublished Boolean @default(false)');
    }
  });
  it('restricts referenced deletions and prevents negative credit positions', () => {
    expect(migration).toContain('"MusicCredit_position_positive_chk"');
    expect(migration).toContain('ON DELETE RESTRICT ON UPDATE CASCADE');
    expect(section('MusicCredit')).toContain('kind MusicCreditKind');
    expect(section('MusicCredit')).toContain('creditedAs String?');
  });
});
