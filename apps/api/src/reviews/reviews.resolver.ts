import {
  UseGuards,
} from '@nestjs/common';

import {
  Args,
  Context,
  ID,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';

import {
  GraphQLError,
} from 'graphql';

import {
  RequireAuthGuard,
} from '../auth/authorization/require-auth.guard.js';

import type {
  GraphQLAuthContext,
} from '../auth/auth.types.js';

import {
  ReviewsService,
} from './reviews.service.js';

import type {
  ReviewPage,
  ReviewRecord,
} from './reviews.service.js';

import {
  ReviewConflictError,
  ReviewForbiddenError,
  ReviewNotFoundError,
  ReviewValidationError,
} from './reviews.errors.js';

import {
  AnimeReviewPageType,
  AnimeReviewType,
  AnimeReviewStatsType,
} from './reviews.graphql.js';

import {
  CreateAnimeReviewInput,
} from './dto/create-anime-review.input.js';

import {
  UpdateAnimeReviewInput,
} from './dto/update-anime-review.input.js';

import {
  ReviewFeedInput,
} from './dto/review-feed.input.js';

function mapReview(
  review: ReviewRecord,
): AnimeReviewType {
  return {
    id: review.id,
    userId: review.userId,
    animeId: review.animeId,
    title: review.title,
    body: review.body,
    score: review.score?.toNumber() ?? null,
    isSpoiler: review.isSpoiler,
    author: review.user,
    anime: review.anime,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

function mapPage(
  page: ReviewPage,
): AnimeReviewPageType {
  return {
    items: page.items.map(mapReview),
    pageInfo: page.pageInfo,
  };
}

function handleReviewError(
  error: unknown,
): never {
  let code = 'INTERNAL_SERVER_ERROR';

  if (error instanceof ReviewValidationError) {
    code = 'BAD_USER_INPUT';
  } else if (error instanceof ReviewConflictError) {
    code = 'CONFLICT';
  } else if (error instanceof ReviewForbiddenError) {
    code = 'FORBIDDEN';
  } else if (error instanceof ReviewNotFoundError) {
    code = 'NOT_FOUND';
  } else {
    throw error;
  }

  throw new GraphQLError(error.message, {
    extensions: { code },
  });
}

@Resolver()
class ReviewsResolver {
  constructor(
    private readonly reviewsService: ReviewsService,
  ) {}

  @Query(() => AnimeReviewType, {
    nullable: true,
  })
  async animeReview(
    @Args('id', { type: () => ID })
    id: string,
  ): Promise<AnimeReviewType | null> {
    try {
      const review =
        await this.reviewsService.findOne(id);

      return review ? mapReview(review) : null;
    } catch (error) {
      return handleReviewError(error);
    }
  }

  @Query(() => AnimeReviewStatsType)
  async animeReviewStats(
    @Args('animeId', { type: () => ID })
    animeId: string,
  ): Promise<AnimeReviewStatsType> {
    return this.reviewsService.getAnimeStats(animeId);
  }

  @Query(() => AnimeReviewPageType)
  async animeReviews(
    @Args('animeId', { type: () => ID })
    animeId: string,

    @Args('input', {
      type: () => ReviewFeedInput,
      nullable: true,
    })
    input?: ReviewFeedInput,
  ): Promise<AnimeReviewPageType> {
    try {
      return mapPage(
        await this.reviewsService.findByAnime(
          animeId,
          input,
        ),
      );
    } catch (error) {
      return handleReviewError(error);
    }
  }

  @Query(() => AnimeReviewPageType, {
    nullable: true,
  })
  async userReviews(
    @Args('username')
    username: string,

    @Args('input', {
      type: () => ReviewFeedInput,
      nullable: true,
    })
    input?: ReviewFeedInput,
  ): Promise<AnimeReviewPageType | null> {
    try {
      const page =
        await this.reviewsService.findByUsername(
          username,
          input,
        );

      return page ? mapPage(page) : null;
    } catch (error) {
      return handleReviewError(error);
    }
  }

  @Mutation(() => AnimeReviewType)
  @UseGuards(RequireAuthGuard)
  async createAnimeReview(
    @Args('input')
    input: CreateAnimeReviewInput,

    @Context()
    context: GraphQLAuthContext,
  ): Promise<AnimeReviewType> {
    try {
      return mapReview(
        await this.reviewsService.create(
          context.currentUser!.id,
          input.animeId,
          input,
        ),
      );
    } catch (error) {
      return handleReviewError(error);
    }
  }

  @Mutation(() => AnimeReviewType)
  @UseGuards(RequireAuthGuard)
  async updateAnimeReview(
    @Args('input')
    input: UpdateAnimeReviewInput,

    @Context()
    context: GraphQLAuthContext,
  ): Promise<AnimeReviewType> {
    try {
      return mapReview(
        await this.reviewsService.update(
          context.currentUser!.id,
          input.id,
          input,
        ),
      );
    } catch (error) {
      return handleReviewError(error);
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(RequireAuthGuard)
  async deleteMyAnimeReview(
    @Args('id', { type: () => ID })
    id: string,

    @Context()
    context: GraphQLAuthContext,
  ): Promise<boolean> {
    try {
      return await this.reviewsService.deleteMine(
        context.currentUser!.id,
        id,
      );
    } catch (error) {
      return handleReviewError(error);
    }
  }
}

export { ReviewsResolver };
