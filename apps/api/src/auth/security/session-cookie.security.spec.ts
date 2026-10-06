import {
  afterEach,
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  DEVELOPMENT_SESSION_COOKIE_NAME,
  getSessionCookieName,
  getSessionCookieOptions,
  PRODUCTION_SESSION_COOKIE_NAME,
} from './session-cookie.security.js';

const originalNodeEnv =
  process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV =
    originalNodeEnv;
});

describe(
  'session cookie security',
  () => {
    it('uses development cookie settings outside production', () => {
      process.env.NODE_ENV =
        'development';

      expect(
        getSessionCookieName(),
      ).toBe(
        DEVELOPMENT_SESSION_COOKIE_NAME,
      );

      expect(
        getSessionCookieOptions(),
      ).toEqual(
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
        }),
      );
    });

    it('uses a __Host cookie in production', () => {
      process.env.NODE_ENV =
        'production';

      expect(
        getSessionCookieName(),
      ).toBe(
        PRODUCTION_SESSION_COOKIE_NAME,
      );

      expect(
        getSessionCookieName()
          .startsWith('__Host-'),
      ).toBe(true);

      expect(
        getSessionCookieOptions(),
      ).toEqual(
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
        }),
      );
    });
  },
);