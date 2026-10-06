import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../database/prisma.service.js';
import {
  AccountIdentityConflictError,
  InvalidCredentialsError,
} from './auth.errors.js';
import type {
  AuthenticatedUser,
} from './auth.types.js';
import type {
  LoginInput,
} from './dto/login.input.js';
import type {
  RegisterInput,
} from './dto/register.input.js';
import {
  hashPassword,
  verifyPassword,
} from './security/password.security.js';
import {
  createSessionExpiry,
  generateSessionToken,
  hashSessionToken,
} from './security/session.security.js';

type AuthResult = {
  user: AuthenticatedUser;
  sessionToken: string;
};

@Injectable()
export class AuthService {
  private readonly dummyPasswordHashPromise =
    hashPassword(
      'invalid-account-password-placeholder',
    );

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async register(
    input: RegisterInput,
  ): Promise<AuthResult> {
    const passwordHash =
      await hashPassword(
        input.password,
      );

    const sessionToken =
      generateSessionToken();

    const tokenHash =
      hashSessionToken(
        sessionToken,
      );

    const expiresAt =
      createSessionExpiry();

    try {
      const user =
        await this.prisma.user.create({
          data: {
            email: input.email,
            username:
              input.username,
            passwordHash,

            sessions: {
              create: {
                tokenHash,
                expiresAt,
              },
            },
          },

          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            role: true,
          },
        });

      return {
        user,
        sessionToken,
      };
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AccountIdentityConflictError();
      }

      throw error;
    }
  }

  async login(
    input: LoginInput,
  ): Promise<AuthResult> {
    const user =
      await this.prisma.user.findFirst({
        where: {
          OR: [
            {
              email:
                input.identifier,
            },
            {
              username:
                input.identifier,
            },
          ],
        },

        select: {
          id: true,
          email: true,
          username: true,
          passwordHash: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          role: true,
        },
      });

    if (!user) {
      const dummyPasswordHash =
        await this.dummyPasswordHashPromise;

      await verifyPassword(
        dummyPasswordHash,
        input.password,
      );

      throw new InvalidCredentialsError();
    }

    const passwordMatches =
      await verifyPassword(
        user.passwordHash,
        input.password,
      );

    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const sessionToken =
      generateSessionToken();

    const tokenHash =
      hashSessionToken(
        sessionToken,
      );

    const expiresAt =
      createSessionExpiry();

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      sessionToken,

      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName:
          user.displayName,
          bio: user.bio,
        avatarUrl:
          user.avatarUrl,
        role: user.role,
      },
    };
  }

  async revokeSession(
    sessionId: string | null,
  ): Promise<void> {
    if (!sessionId) {
      return;
    }

    await this.prisma.session.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}