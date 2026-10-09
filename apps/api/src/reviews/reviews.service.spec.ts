import { jest } from '@jest/globals';

import {
  AnimeCatalogStatus,
  Prisma,
} from '@prisma/client';

import {
  ReviewsService,
} from './reviews.service.js';

import {
  ReviewConflictError,
  ReviewForbiddenError,
  ReviewNotFoundError,
  ReviewValidationError,
} from './reviews.errors.js';

import type {
  PrismaService,
} from '../database/prisma.service.js';

import type {
  ActivityEventService,
} from '../activities/activity-event.service.js';

describe('ReviewsService', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const otherUserId = '22222222-2222-4222-8222-222222222222';
  const animeId = '33333333-3333-4333-8333-333333333333';
  const reviewId = '44444444-4444-4444-8444-444444444444';

  const makeRecord = () => ({
    id: reviewId,
    userId,
    animeId,
    title: 'Great anime',
    body: 'A thoughtful review.',
    score: new Prisma.Decimal('8.5'),
    isSpoiler: false,
    createdAt: new Date('2026-10-09T00:00:00Z'),
    updatedAt: new Date('2026-10-09T00:00:00Z'),
    user: {
      id: userId,
      username: 'reviewer',
      displayName: null,
      avatarUrl: null,
    },
    anime: {
      id: animeId,
      slug: 'test-anime',
      title: 'Test Anime',
      coverImageUrl: null,
    },
  });

  function setup() {
    const animeFindUnique = jest.fn(
      async (
        _args: unknown,
      ): Promise<{
        catalogStatus: AnimeCatalogStatus;
      }> => ({
        catalogStatus: AnimeCatalogStatus.INCLUDED,
      }),
    );

    const userFindUnique = jest.fn(
      async (_args: unknown) => ({
        id: userId,
      }),
    );

    const reviewFindUnique = jest.fn(
      async (
        _args: unknown,
      ): Promise<
        ReturnType<typeof makeRecord> | null
      > => makeRecord(),
    );

    const reviewCreate = jest.fn(
      async (_args: unknown) => makeRecord(),
    );

    const reviewUpdateMany = jest.fn(
      async (_args: unknown) => ({
        count: 1,
      }),
    );

    const reviewDeleteMany = jest.fn(
      async (_args: unknown) => ({
        count: 1,
      }),
    );

    const reviewCount = jest.fn(
      async (_args: unknown) => 2,
    );

    const reviewFindMany = jest.fn(
      async (_args: unknown) => [
        makeRecord(),
      ],
    );

    const reviewAggregate = jest.fn(
      async (_args: unknown) => ({
        _count: {
          _all: 2,
          score: 1,
        },
        _avg: {
          score: new Prisma.Decimal('8.5'),
        },
      }),
    );

    const activityEvents = {
      recordReviewPublishedBestEffort: jest.fn(
        async (_args: unknown): Promise<void> => {},
      ),
    };

    const prisma = {
      anime: {
        findUnique: animeFindUnique,
      },
      user: {
        findUnique: userFindUnique,
      },
      animeReview: {
        findUnique: reviewFindUnique,
        create: reviewCreate,
        updateMany: reviewUpdateMany,
        deleteMany: reviewDeleteMany,
        count: reviewCount,
        findMany: reviewFindMany,
        aggregate: reviewAggregate,
      },
    };

    const service = new ReviewsService(
      prisma as unknown as PrismaService,
      activityEvents as unknown as ActivityEventService,
    );

    return {
      service,
      activityEvents,
      reviewAggregate,
      animeFindUnique,
      userFindUnique,
      reviewFindUnique,
      reviewCreate,
      reviewUpdateMany,
      reviewDeleteMany,
      reviewCount,
      reviewFindMany,
    };
  }

  it('only previews 3 newest non-spoiler reviews for confirmed non-adult INCLUDED anime', async () => {
    const { service, reviewFindMany } = setup();
    const result = await service.findRecentPublic();
    expect(result).toHaveLength(1);
    expect(reviewFindMany).toHaveBeenCalledWith({
      where: {
        isSpoiler: false,
        anime: { is: { catalogStatus: AnimeCatalogStatus.INCLUDED, isAdult: false } },
      },
      select: expect.any(Object),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 3,
    });
  });

  it('creates a review for an included anime', async () => {
    const { service, reviewCreate } = setup();

    const result = await service.create(
      userId,
      animeId,
      {
        title: '  Great anime  ',
        body: '  A thoughtful review.  ',
        score: 8.5,
        isSpoiler: false,
      },
    );

    expect(result.id).toBe(reviewId);

    expect(reviewCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId,
          animeId,
          title: 'Great anime',
          body: 'A thoughtful review.',
          score: 8.5,
          isSpoiler: false,
        }),
      }),
    );
  });

  it.each([
    ['empty', ''],
    ['whitespace', '   '],
    ['too long', 'A'.repeat(10001)],
  ])('rejects %s review body', async (_label, body) => {
    const { service, reviewCreate } = setup();

    await expect(
      service.create(userId, animeId, { body }),
    ).rejects.toBeInstanceOf(
      ReviewValidationError,
    );

    expect(reviewCreate).not.toHaveBeenCalled();
  });

  it.each([
    0,
    0.5,
    10.5,
    7.3,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])('rejects invalid score %s', async (score) => {
    const { service } = setup();

    await expect(
      service.create(userId, animeId, {
        body: 'Review',
        score,
      }),
    ).rejects.toBeInstanceOf(
      ReviewValidationError,
    );
  });

  it('generates review activity after creation', async () => {
    const { service, activityEvents } = setup();

    await service.create(userId, animeId, {
      body: 'Published review',
    });

    expect(
      activityEvents.recordReviewPublishedBestEffort,
    ).toHaveBeenCalledWith({
      userId,
      animeId,
    });
  });

  it('returns aggregate review statistics', async () => {
    const { service, reviewAggregate } = setup();

    const result = await service.getAnimeStats(animeId);

    expect(result).toEqual({
      animeId,
      totalReviews: 2,
      scoredReviews: 1,
      averageScore: 8.5,
    });

    expect(reviewAggregate).toHaveBeenCalledWith({
      where: { animeId },
      _count: {
        _all: true,
        score: true,
      },
      _avg: {
        score: true,
      },
    });
  });

  it('accepts optional score', async () => {
    const { service, reviewCreate } = setup();

    await service.create(userId, animeId, {
      body: 'Review without score',
    });

    expect(reviewCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          score: null,
          isSpoiler: false,
        }),
      }),
    );
  });

  it('rejects whitespace-only title', async () => {
    const { service } = setup();

    await expect(
      service.create(userId, animeId, {
        title: '   ',
        body: 'Review',
      }),
    ).rejects.toBeInstanceOf(
      ReviewValidationError,
    );
  });

  it('rejects anime not eligible for review', async () => {
    const { service, animeFindUnique, reviewCreate } =
      setup();

    animeFindUnique.mockResolvedValueOnce({
      catalogStatus: AnimeCatalogStatus.REVIEW,
    });

    await expect(
      service.create(userId, animeId, {
        body: 'Review',
      }),
    ).rejects.toBeInstanceOf(
      ReviewValidationError,
    );

    expect(reviewCreate).not.toHaveBeenCalled();
  });

  it('rejects duplicate reviews', async () => {
    const { service, reviewCreate } = setup();

    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '7.10.0',
      },
    );

    reviewCreate.mockRejectedValueOnce(error);

    await expect(
      service.create(userId, animeId, {
        body: 'Review',
      }),
    ).rejects.toBeInstanceOf(
      ReviewConflictError,
    );
  });

  it('rejects update by non-owner', async () => {
    const { service, reviewUpdateMany } = setup();

    await expect(
      service.update(otherUserId, reviewId, {
        body: 'Unauthorized edit',
      }),
    ).rejects.toBeInstanceOf(
      ReviewForbiddenError,
    );

    expect(reviewUpdateMany).not.toHaveBeenCalled();
  });

  it('updates review with atomic ownership scope', async () => {
    const { service, reviewUpdateMany } = setup();

    await service.update(userId, reviewId, {
      body: '  Updated review  ',
      score: 9,
      isSpoiler: true,
    });

    expect(reviewUpdateMany).toHaveBeenCalledWith({
      where: {
        id: reviewId,
        userId,
      },
      data: {
        body: 'Updated review',
        score: 9,
        isSpoiler: true,
      },
    });
  });

  it('returns not found for missing review', async () => {
    const { service, reviewFindUnique } = setup();

    reviewFindUnique.mockResolvedValueOnce(null);

    await expect(
      service.update(userId, reviewId, {
        body: 'Updated',
      }),
    ).rejects.toBeInstanceOf(
      ReviewNotFoundError,
    );
  });

  it('scopes deletion to the authenticated owner', async () => {
    const { service, reviewDeleteMany } = setup();

    expect(
      await service.deleteMine(userId, reviewId),
    ).toBe(true);

    expect(reviewDeleteMany).toHaveBeenCalledWith({
      where: {
        id: reviewId,
        userId,
      },
    });
  });

  it('returns false when no review was deleted', async () => {
    const { service, reviewDeleteMany } = setup();

    reviewDeleteMany.mockResolvedValueOnce({
      count: 0,
    });

    expect(
      await service.deleteMine(userId, reviewId),
    ).toBe(false);
  });

  it('returns deterministic paginated anime reviews', async () => {
    const { service, reviewFindMany } = setup();

    const page = await service.findByAnime(
      animeId,
      {
        page: 1,
        perPage: 1,
      },
    );

    expect(page.pageInfo).toEqual({
      page: 1,
      perPage: 1,
      total: 2,
      pageCount: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    });

    expect(reviewFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { animeId },
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        skip: 0,
        take: 1,
      }),
    );
  });

  it('resolves reviews by username', async () => {
    const { service, userFindUnique } = setup();

    const result = await service.findByUsername(
      'REVIEWER',
    );

    expect(result).not.toBeNull();

    expect(userFindUnique).toHaveBeenCalledWith({
      where: {
        username: 'reviewer',
      },
      select: {
        id: true,
      },
    });
  });

  it('rejects invalid pagination', async () => {
    const { service } = setup();

    await expect(
      service.findByAnime(animeId, {
        page: 0,
        perPage: 20,
      }),
    ).rejects.toBeInstanceOf(
      ReviewValidationError,
    );

    await expect(
      service.findByAnime(animeId, {
        page: 1,
        perPage: 101,
      }),
    ).rejects.toBeInstanceOf(
      ReviewValidationError,
    );
  });
});
