import { Injectable } from '@nestjs/common';
import {
  Prisma,
  AnimeCatalogStatus,
} from '@prisma/client';

import {
  PrismaService,
} from '../database/prisma.service.js';

import {
  ActivityEventService,
} from '../activities/activity-event.service.js';

import {
  ReviewValidationError,
  ReviewForbiddenError,
  ReviewNotFoundError,
  ReviewConflictError,
} from './reviews.errors.js';

const reviewSelect = {
  id: true,
  userId: true,
  animeId: true,
  title: true,
  body: true,
  score: true,
  isSpoiler: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  anime: {
    select: {
      id: true,
      slug: true,
      title: true,
      coverImageUrl: true,
    },
  },
} satisfies Prisma.AnimeReviewSelect;

type ReviewRecord = Prisma.AnimeReviewGetPayload<{
  select: typeof reviewSelect;
}>;

type ReviewPage = {
  items: ReviewRecord[];
  pageInfo: {
    page: number;
    perPage: number;
    total: number;
    pageCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

type ReviewInput = {
  title?: string | null;
  body: string;
  score?: number | null;
  isSpoiler?: boolean;
};

type UpdateReviewInput = {
  title?: string | null;
  body?: string;
  score?: number | null;
  isSpoiler?: boolean;
};

type ReviewPaginationInput = {
  page?: number;
  perPage?: number;
};

@Injectable()
class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityEvents: ActivityEventService,
  ) {}

  private validateTitle(
    title: string | null | undefined,
  ): string | null {
    if (title == null) {
      return null;
    }

    if (typeof title !== 'string') {
      throw new ReviewValidationError('Invalid review title.');
    }

    const value = title.trim();

    if (value.length === 0 || value.length > 150) {
      throw new ReviewValidationError(
        'Review title must contain 1 to 150 characters.',
      );
    }

    return value;
  }

  private validateBody(body: string): string {
    if (typeof body !== 'string') {
      throw new ReviewValidationError('Review body is required.');
    }

    const value = body.trim();

    if (value.length === 0 || value.length > 10000) {
      throw new ReviewValidationError(
        'Review body must contain 1 to 10000 characters.',
      );
    }

    return value;
  }

  private validateScore(
    score: number | null | undefined,
  ): number | null {
    if (score == null) {
      return null;
    }

    if (
      typeof score !== 'number' ||
      !Number.isFinite(score) ||
      score < 1 ||
      score > 10 ||
      !Number.isInteger(score * 2)
    ) {
      throw new ReviewValidationError(
        'Review score must be between 1 and 10 in 0.5 increments.',
      );
    }

    return score;
  }

  private validateSpoiler(value: boolean): boolean {
    if (typeof value !== 'boolean') {
      throw new ReviewValidationError(
        'isSpoiler must be a boolean.',
      );
    }

    return value;
  }

  private pagination(input?: ReviewPaginationInput) {
    const page = input?.page ?? 1;
    const perPage = input?.perPage ?? 20;

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(perPage) ||
      perPage < 1 ||
      perPage > 100 ||
      (page - 1) * perPage > 2147483647
    ) {
      throw new ReviewValidationError(
        'Invalid review pagination.',
      );
    }

    return { page, perPage };
  }

  private async findPage(
    where: Prisma.AnimeReviewWhereInput,
    input?: ReviewPaginationInput,
  ): Promise<ReviewPage> {
    const { page, perPage } = this.pagination(input);

    const [total, items] = await Promise.all([
      this.prisma.animeReview.count({ where }),
      this.prisma.animeReview.findMany({
        where,
        select: reviewSelect,
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    const pageCount = Math.ceil(total / perPage);

    return {
      items,
      pageInfo: {
        page,
        perPage,
        total,
        pageCount,
        hasNextPage: page < pageCount,
        hasPreviousPage: total > 0 && page > 1,
      },
    };
  }

  async getAnimeStats(animeId: string) {
    const stats = await this.prisma.animeReview.aggregate({
      where: {
        animeId,
      },
      _count: {
        _all: true,
        score: true,
      },
      _avg: {
        score: true,
      },
    });

    return {
      animeId,
      totalReviews: stats._count._all,
      scoredReviews: stats._count.score,
      averageScore:
        stats._avg.score?.toNumber() ?? null,
    };
  }

  async findOne(id: string): Promise<ReviewRecord | null> {
    return this.prisma.animeReview.findUnique({
      where: { id },
      select: reviewSelect,
    });
  }

  async findByAnime(
    animeId: string,
    input?: ReviewPaginationInput,
  ): Promise<ReviewPage> {
    return this.findPage({ animeId }, input);
  }

  async findByUsername(
    username: string,
    input?: ReviewPaginationInput,
  ): Promise<ReviewPage | null> {
    const normalized = username.trim().toLowerCase();

    if (!/^[a-z0-9_]{3,24}$/.test(normalized)) {
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: { username: normalized },
      select: { id: true },
    });

    if (!user) {
      return null;
    }

    return this.findPage({ userId: user.id }, input);
  }

  async create(
    userId: string,
    animeId: string,
    input: ReviewInput,
  ): Promise<ReviewRecord> {
    const title = this.validateTitle(input.title);
    const body = this.validateBody(input.body);
    const score = this.validateScore(input.score);
    const isSpoiler = this.validateSpoiler(
      input.isSpoiler ?? false,
    );

    const anime = await this.prisma.anime.findUnique({
      where: { id: animeId },
      select: { catalogStatus: true },
    });

    if (
      !anime ||
      anime.catalogStatus !== AnimeCatalogStatus.INCLUDED
    ) {
      throw new ReviewValidationError(
        'Anime is not available for reviews.',
      );
    }

    try {
      const created = await this.prisma.animeReview.create({
        data: {
          userId,
          animeId,
          title,
          body,
          score,
          isSpoiler,
        },
        select: reviewSelect,
      });

      await this.activityEvents.recordReviewPublishedBestEffort({
        userId,
        animeId,
      });

      return created;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ReviewConflictError();
      }

      throw error;
    }
  }

  async update(
    userId: string,
    reviewId: string,
    input: UpdateReviewInput,
  ): Promise<ReviewRecord> {
    const existing = await this.prisma.animeReview.findUnique({
      where: { id: reviewId },
      select: { userId: true },
    });

    if (!existing) {
      throw new ReviewNotFoundError();
    }

    if (existing.userId !== userId) {
      throw new ReviewForbiddenError();
    }

    const data: Prisma.AnimeReviewUpdateManyMutationInput = {};

    if (input.title !== undefined) {
      data.title = this.validateTitle(input.title);
    }

    if (input.body !== undefined) {
      data.body = this.validateBody(input.body);
    }

    if (input.score !== undefined) {
      data.score = this.validateScore(input.score);
    }

    if (input.isSpoiler !== undefined) {
      data.isSpoiler = this.validateSpoiler(input.isSpoiler);
    }

    // Atomic ownership scope avoids an update race.
    const result = await this.prisma.animeReview.updateMany({
      where: {
        id: reviewId,
        userId,
      },
      data,
    });

    if (result.count === 0) {
      throw new ReviewNotFoundError();
    }

    const updated = await this.findOne(reviewId);

    if (!updated) {
      throw new ReviewNotFoundError();
    }

    return updated;
  }

  async deleteMine(
    userId: string,
    reviewId: string,
  ): Promise<boolean> {
    const result = await this.prisma.animeReview.deleteMany({
      where: {
        id: reviewId,
        userId,
      },
    });

    return result.count > 0;
  }
}

export {
  ReviewsService,
};

export type {
  ReviewInput,
  UpdateReviewInput,
  ReviewPaginationInput,
  ReviewRecord,
  ReviewPage,
};
