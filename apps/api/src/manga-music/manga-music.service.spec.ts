import { jest } from '@jest/globals';
import { MangaMusicService } from './manga-music.service.js';
import type { PrismaService } from '../database/prisma.service.js';

describe('AN-136 public catalogue policy', () => {
  it('does not include adult or unpublished manga', async () => {
    const findMany = jest.fn(async () => []);
    const service = new MangaMusicService({ mangaWork: { findMany } } as unknown as PrismaService);
    await service.manga();
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isPublished: true, isAdult: false }, take: 20 }));
  });
  it('does not expose music tied to unknown/adult anime', async () => {
    const findMany = jest.fn(async () => []);
    const service = new MangaMusicService({ animeMusicTrack: { findMany } } as unknown as PrismaService);
    await service.music();
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ isPublished: true }), take: 20 }));
    const args = findMany.mock.calls.length;
    expect(args).toBe(1);
  });
});
