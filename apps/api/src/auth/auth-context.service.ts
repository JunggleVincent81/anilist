import { Injectable } from '@nestjs/common';
import type {
  Request,
  Response,
} from 'express';

import { PrismaService } from '../database/prisma.service.js';
import type {
  AuthenticatedUser,
  GraphQLAuthContext,
} from './auth.types.js';
import {
  getSessionCookieName,
} from './security/session-cookie.security.js';
import {
  readCookie,
} from './security/session-cookie-reader.security.js';
import {
  hashSessionToken,
  isSessionExpired,
} from './security/session.security.js';

@Injectable()
export class AuthContextService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createContext(
    req: Request,
    res: Response,
  ): Promise<GraphQLAuthContext> {
    const unauthenticatedContext =
      this.createUnauthenticatedContext(
        req,
        res,
      );

    const token = readCookie(
      req.headers.cookie,
      getSessionCookieName(),
    );

    if (!token) {
      return unauthenticatedContext;
    }

    const tokenHash =
      hashSessionToken(token);

    const session =
      await this.prisma.session.findUnique({
        where: {
          tokenHash,
        },
        select: {
          id: true,
          expiresAt: true,
          revokedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              displayName: true,
              bio: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      });

    if (!session) {
      return unauthenticatedContext;
    }

    if (session.revokedAt) {
      return unauthenticatedContext;
    }

    if (
      isSessionExpired(
        session.expiresAt,
      )
    ) {
      return unauthenticatedContext;
    }

    const currentUser: AuthenticatedUser = {
      id: session.user.id,
      email: session.user.email,
      username: session.user.username,
      displayName:
        session.user.displayName,
      bio: session.user.bio,
      avatarUrl:
        session.user.avatarUrl,
      role: session.user.role,
    };

    return {
      req,
      res,
      currentUser,
      currentSession: {
        id: session.id,
        expiresAt:
          session.expiresAt,
      },
    };
  }

  private createUnauthenticatedContext(
    req: Request,
    res: Response,
  ): GraphQLAuthContext {
    return {
      req,
      res,
      currentUser: null,
      currentSession: null,
    };
  }
}