import {
  Injectable,
} from '@nestjs/common';
import type {
  Prisma,
} from '@prisma/client';

import {
  PrismaService,
} from '../database/prisma.service.js';
import type {
  AuthenticatedUser,
} from '../auth/auth.types.js';
import type {
  UpdateProfileInput,
} from './dto/update-profile.input.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async findPublicProfile(
    username: string,
  ) {
    const normalizedUsername =
      username
        .trim()
        .toLowerCase();

    if (
      !/^[a-z0-9_]{3,24}$/.test(
        normalizedUsername,
      )
    ) {
      return null;
    }

    return this.prisma.user.findUnique({
      where: {
        username:
          normalizedUsername,
      },

      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<AuthenticatedUser> {
    const data:
      Prisma.UserUpdateInput = {};

    if (
      input.displayName !==
      undefined
    ) {
      data.displayName =
        input.displayName;
    }

    if (input.bio !== undefined) {
      data.bio = input.bio;
    }

    if (
      input.avatarUrl !==
      undefined
    ) {
      data.avatarUrl =
        input.avatarUrl;
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },

      data,

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
  }
}