import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  hashPassword,
  verifyPassword,
} from './password.security.js';

describe('password security', () => {
  const password =
    'this-is-a-long-secure-password';

  it('hashes passwords with Argon2id', async () => {
    const hash =
      await hashPassword(password);

    expect(hash).not.toBe(password);

    expect(
      hash.startsWith('$argon2id$'),
    ).toBe(true);
  });

  it('verifies the correct password', async () => {
    const hash =
      await hashPassword(password);

    await expect(
      verifyPassword(
        hash,
        password,
      ),
    ).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash =
      await hashPassword(password);

    await expect(
      verifyPassword(
        hash,
        'definitely-wrong-password',
      ),
    ).resolves.toBe(false);
  });

  it('returns false for a malformed hash', async () => {
    await expect(
      verifyPassword(
        'not-an-argon2-hash',
        password,
      ),
    ).resolves.toBe(false);
  });
});