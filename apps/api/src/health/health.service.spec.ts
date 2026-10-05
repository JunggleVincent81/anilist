import { jest } from '@jest/globals';
import type { PrismaService } from '../database/prisma.service.js';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it('returns ok when the database query succeeds', async () => {
    const queryRaw = jest.fn<() => Promise<unknown[]>>().mockResolvedValue([{ '?column?': 1 }]);
    const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;
    const service = new HealthService(prisma);

    await expect(service.check()).resolves.toEqual({ status: 'ok' });
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });
});
