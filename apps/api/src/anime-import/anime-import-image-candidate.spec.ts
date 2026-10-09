import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  normalizeSourceImageCandidates,
  parseSourceImageCandidate,
} from './anime-import-image-candidate.js';

describe('AN-139B2 unapproved image candidates', () => {
  const picture = 'https://cdn.myanimelist.net/images/anime/4/19644.jpg';
  const thumbnail = 'https://media.kitsu.app/posters/12345.webp';

  it('normalizes separate picture/thumbnail provenance without display approval', () => {
    const result = normalizeSourceImageCandidates({ picture, thumbnail });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      sourceDataset: 'anime-offline-database',
      sourceField: 'picture',
      sourceHost: 'cdn.myanimelist.net',
      sourceUrl: picture,
      rightsStatus: 'UNVERIFIED',
      displayApproved: false,
      ageApproved: false,
      riskHints: [],
    });
    expect(result[1]).toMatchObject({
      sourceField: 'thumbnail',
      sourceHost: 'media.kitsu.app',
      displayApproved: false,
    });
  });

  it('rejects non-HTTPS, local addresses, unknown hosts, and credential URLs', () => {
    for (const url of [
      'http://cdn.myanimelist.net/cover.png',
      'javascript:alert(1)',
      'https://localhost/internal.png',
      'https://127.0.0.1/private.png',
      'https://cdn.myanimelist.net.evil.test/cover.png',
      'https://someone:secret@cdn.myanimelist.net/cover.png',
      'https://cdn.myanimelist.net:8443/cover.png',
      'https://cdn.myanimelist.net/cover.png#frag',
      'https://cdn.myanimelist.net\\@evil.test/cover.png',
      'https://unknown.example.com/cover.png',
      'https://cdn.myanimelist.net/' + 'a'.repeat(3000),
    ]) {
      expect(parseSourceImageCandidate(url, 'picture')).toBeNull();
    }
  });

  it('rejects recognizable placeholders even when HTTPS', () => {
    for (const url of [
      'https://raw.githubusercontent.com/cedya77/anime-offline-database/main/no_pic.png',
      'https://cdn.anime-planet.com/anime/default-cover.webp',
      'https://cdn.myanimelist.net/images/placeholder.png',
    ]) {
      expect(parseSourceImageCandidate(url, 'thumbnail')).toBeNull();
    }
  });

  it('requires review for sensitive URL hints, never decides the age', () => {
    const value = parseSourceImageCandidate(
      'https://cdn.anisearch.com/images/adult/example.webp',
      'picture',
    );
    expect(value).toMatchObject({
      rightsStatus: 'UNVERIFIED',
      ageApproved: false,
      displayApproved: false,
      riskHints: ['SENSITIVE_URL_PATH'],
    });
  });

  it('ignores null, non-strings, malformed records, and unknown domains', () => {
    expect(normalizeSourceImageCandidates({})).toEqual([]);
    expect(normalizeSourceImageCandidates({ picture: 7, thumbnail: null })).toEqual([]);
    expect(normalizeSourceImageCandidates({
      picture: 'https://not-authorized.example/123.png',
      thumbnail: 'not-a-url',
    })).toEqual([]);
  });

  it('retains original source URL metadata only; cannot grant media rights', () => {
    const value = parseSourceImageCandidate(picture, 'picture');
    expect(value?.rightsStatus).toBe('UNVERIFIED');
    expect(value?.displayApproved).toBe(false);
    expect(value?.ageApproved).toBe(false);
  });
});
