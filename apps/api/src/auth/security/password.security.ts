import * as argon2 from 'argon2';

const PASSWORD_HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
} as const;

async function hashPassword(
  password: string,
): Promise<string> {
  return argon2.hash(
    password,
    PASSWORD_HASH_OPTIONS,
  );
}

async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(
      passwordHash,
      password,
    );
  } catch {
    return false;
  }
}

export {
  hashPassword,
  PASSWORD_HASH_OPTIONS,
  verifyPassword,
};