import { jest } from '@jest/globals';
import { ServiceUnavailableException } from '@nestjs/common';
import type { HealthService } from './health.service.js';
import { HealthHttpController } from './health.http.controller.js';

describe('HTTP health endpoints', () => {
  const check = jest.fn<() => Promise<{ status: string }>>();
  const controller = new HealthHttpController({ check } as unknown as HealthService);

  beforeEach(() => check.mockReset());

  it('answers liveness without querying the database', () => {
    expect(controller.live()).toEqual({ status: 'ok' });
    expect(check).not.toHaveBeenCalled();
  });
  it('returns ready only when the database responds', async () => {
    check.mockResolvedValueOnce({ status: 'ok' });
    await expect(controller.ready()).resolves.toEqual({ status: 'ok' });
    expect(check).toHaveBeenCalledTimes(1);
  });
  it('redacts database errors with HTTP 503', async () => {
    check.mockRejectedValueOnce(new Error('private db connection detail'));
    await expect(controller.ready()).rejects.toThrow(ServiceUnavailableException);
  });
});
