import {
  SESSION_TTL_MS,
} from './session.security.js';

const DEVELOPMENT_SESSION_COOKIE_NAME =
  'anilist_session';

const PRODUCTION_SESSION_COOKIE_NAME =
  '__Host-anilist_session';

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function getSessionCookieName(): string {
  return isProduction()
    ? PRODUCTION_SESSION_COOKIE_NAME
    : DEVELOPMENT_SESSION_COOKIE_NAME;
}

function getSessionCookieOptions() {
  return {
    httpOnly: true as const,
    secure: isProduction(),
    sameSite: 'lax' as const,
    path: '/' as const,
    maxAge: SESSION_TTL_MS,
  };
}

function getSessionCookieClearOptions() {
  return {
    httpOnly: true as const,
    secure: isProduction(),
    sameSite: 'lax' as const,
    path: '/' as const,
  };
}

export {
  DEVELOPMENT_SESSION_COOKIE_NAME,
  getSessionCookieClearOptions,
  getSessionCookieName,
  getSessionCookieOptions,
  PRODUCTION_SESSION_COOKIE_NAME,
};