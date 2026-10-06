import {
  createHash,
  randomBytes,
} from 'node:crypto';

const SESSION_TOKEN_BYTES = 32;

const SESSION_TTL_DAYS = 30;

const SESSION_TTL_MS =
  SESSION_TTL_DAYS *
  24 *
  60 *
  60 *
  1000;

function generateSessionToken(): string {
  return randomBytes(
    SESSION_TOKEN_BYTES,
  ).toString('base64url');
}

function hashSessionToken(
  token: string,
): string {
  return createHash('sha256')
    .update(token, 'utf8')
    .digest('hex');
}

function createSessionExpiry(
  now = new Date(),
): Date {
  return new Date(
    now.getTime() + SESSION_TTL_MS,
  );
}

function isSessionExpired(
  expiresAt: Date,
  now = new Date(),
): boolean {
  return expiresAt.getTime() <= now.getTime();
}

export {
  createSessionExpiry,
  generateSessionToken,
  hashSessionToken,
  isSessionExpired,
  SESSION_TOKEN_BYTES,
  SESSION_TTL_DAYS,
  SESSION_TTL_MS,
};