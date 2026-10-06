import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  createSessionExpiry,
  generateSessionToken,
  hashSessionToken,
  isSessionExpired,
  SESSION_TTL_DAYS,
  SESSION_TTL_MS,
} from './session.security.js';

describe('session security', () => {
  it('generates different random tokens', () => {
    const first =
      generateSessionToken();

    const second =
      generateSessionToken();

    expect(first).not.toBe(second);

    expect(first.length)
      .toBeGreaterThan(30);

    expect(second.length)
      .toBeGreaterThan(30);
  });

  it('hashes session tokens as SHA-256 hex', () => {
    const hash =
      hashSessionToken(
        'test-session-token',
      );

    expect(hash).toMatch(
      /^[a-f0-9]{64}$/,
    );
  });

  it('produces deterministic token hashes', () => {
    expect(
      hashSessionToken('same-token'),
    ).toBe(
      hashSessionToken('same-token'),
    );
  });

  it('uses the configured session lifetime', () => {
    expect(
      SESSION_TTL_MS,
    ).toBe(
      SESSION_TTL_DAYS *
        24 *
        60 *
        60 *
        1000,
    );
  });

  it('creates expiry from the supplied time', () => {
    const now =
      new Date(
        '2026-10-06T00:00:00.000Z',
      );

    const expiry =
      createSessionExpiry(now);

    expect(
      expiry.getTime() -
        now.getTime(),
    ).toBe(SESSION_TTL_MS);
  });

  it('detects expired sessions', () => {
    const now =
      new Date(
        '2026-10-06T00:00:00.000Z',
      );

    expect(
      isSessionExpired(
        new Date(
          '2026-10-05T23:59:59.999Z',
        ),
        now,
      ),
    ).toBe(true);

    expect(
      isSessionExpired(
        new Date(
          '2026-10-06T00:00:00.000Z',
        ),
        now,
      ),
    ).toBe(true);

    expect(
      isSessionExpired(
        new Date(
          '2026-10-06T00:00:00.001Z',
        ),
        now,
      ),
    ).toBe(false);
  });
});