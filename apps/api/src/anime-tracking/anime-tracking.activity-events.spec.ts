import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  AnimeFormat,
  AnimeListStatus,
  AnimeReleaseStatus,
} from '@prisma/client';

import type {
  PrismaService,
} from '../database/prisma.service.js';

import type {
  ActivityEventService,
} from '../activities/activity-event.service.js';

import {
  AnimeTrackingService,
} from './anime-tracking.service.js';

const USER_ID =
  '11111111-1111-4111-8111-111111111111';

const ANIME_ID =
  '22222222-2222-4222-8222-222222222222';

const ENTRY_ID =
  '33333333-3333-4333-8333-333333333333';

function createEntry(
  status:
    AnimeListStatus,
  progressEpisodes:
    number,
) {
  const now =
    new Date(
      '2026-10-08T00:00:00.000Z',
    );

  return {
    id:
      ENTRY_ID,

    status,

    progressEpisodes,

    score: null,

    rewatchCount: 0,

    startedAt:
      status ===
      AnimeListStatus
        .PLANNING
        ? null
        : now,

    completedAt:
      status ===
      AnimeListStatus
        .COMPLETED
        ? now
        : null,

    createdAt:
      now,

    updatedAt:
      now,

    anime: {
      id:
        ANIME_ID,

      slug:
        'example-anime',

      title:
        'Example Anime',

      format:
        AnimeFormat.TV,

      status:
        AnimeReleaseStatus
          .AIRING,

      episodes: 12,

      season: null,

      seasonYear:
        2026,

      coverImageUrl:
        null,
    },
  };
}

function createActivityEvents() {
  const recordTrackingUpdateBestEffort =
    jest.fn(
      async (
        _input: unknown,
      ) => undefined,
    );

  return {
    service: {
      recordTrackingUpdateBestEffort,
    } as unknown as
      ActivityEventService,

    recordTrackingUpdateBestEffort,
  };
}

describe(
  'AnimeTrackingService activity integration',
  () => {
    it(
      'emits a tracking delta when a new list entry is created',
      async () => {
        const {
          service:
            activityEvents,

          recordTrackingUpdateBestEffort,
        } =
          createActivityEvents();

        const prisma = {
          anime: {
            findFirst:
              jest.fn(
                async () => ({
                  id:
                    ANIME_ID,

                  episodes: 12,
                }),
              ),
          },

          animeListEntry: {
            findUnique:
              jest.fn(
                async () =>
                  null,
              ),

            upsert:
              jest.fn(
                async () =>
                  createEntry(
                    AnimeListStatus
                      .WATCHING,
                    0,
                  ),
              ),
          },
        } as unknown as
          PrismaService;

        const service =
          new AnimeTrackingService(
            prisma,
            undefined,
            activityEvents,
          );

        await service.upsert(
          USER_ID,
          {
            animeId:
              ANIME_ID,

            status:
              AnimeListStatus
                .WATCHING,
          },
        );

        expect(
          recordTrackingUpdateBestEffort,
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,

          animeId:
            ANIME_ID,

          previousStatus:
            null,

          nextStatus:
            AnimeListStatus
              .WATCHING,

          previousProgressEpisodes:
            null,

          nextProgressEpisodes:
            0,
        });
      },
    );

    it(
      'emits status delta when tracking status changes',
      async () => {
        const {
          service:
            activityEvents,

          recordTrackingUpdateBestEffort,
        } =
          createActivityEvents();

        const prisma = {
          anime: {
            findFirst:
              jest.fn(
                async () => ({
                  id:
                    ANIME_ID,

                  episodes: 12,
                }),
              ),
          },

          animeListEntry: {
            findUnique:
              jest.fn(
                async () => ({
                  status:
                    AnimeListStatus
                      .WATCHING,

                  progressEpisodes:
                    4,

                  score: null,

                  rewatchCount:
                    0,

                  startedAt:
                    new Date(),

                  completedAt:
                    null,
                }),
              ),

            upsert:
              jest.fn(
                async () =>
                  createEntry(
                    AnimeListStatus
                      .COMPLETED,
                    12,
                  ),
              ),
          },
        } as unknown as
          PrismaService;

        const service =
          new AnimeTrackingService(
            prisma,
            undefined,
            activityEvents,
          );

        await service.upsert(
          USER_ID,
          {
            animeId:
              ANIME_ID,

            status:
              AnimeListStatus
                .COMPLETED,
          },
        );

        expect(
          recordTrackingUpdateBestEffort,
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,

          animeId:
            ANIME_ID,

          previousStatus:
            AnimeListStatus
              .WATCHING,

          nextStatus:
            AnimeListStatus
              .COMPLETED,

          previousProgressEpisodes:
            4,

          nextProgressEpisodes:
            12,
        });
      },
    );

    it(
      'emits progress delta when episode progress changes',
      async () => {
        const {
          service:
            activityEvents,

          recordTrackingUpdateBestEffort,
        } =
          createActivityEvents();

        const prisma = {
          anime: {
            findFirst:
              jest.fn(
                async () => ({
                  id:
                    ANIME_ID,

                  episodes: 12,
                }),
              ),
          },

          animeListEntry: {
            findUnique:
              jest.fn(
                async () => ({
                  status:
                    AnimeListStatus
                      .WATCHING,

                  progressEpisodes:
                    3,

                  score: null,

                  rewatchCount:
                    0,

                  startedAt:
                    new Date(),

                  completedAt:
                    null,
                }),
              ),

            upsert:
              jest.fn(
                async () =>
                  createEntry(
                    AnimeListStatus
                      .WATCHING,
                    4,
                  ),
              ),
          },
        } as unknown as
          PrismaService;

        const service =
          new AnimeTrackingService(
            prisma,
            undefined,
            activityEvents,
          );

        await service.upsert(
          USER_ID,
          {
            animeId:
              ANIME_ID,

            progressEpisodes:
              4,
          },
        );

        expect(
          recordTrackingUpdateBestEffort,
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,

          animeId:
            ANIME_ID,

          previousStatus:
            AnimeListStatus
              .WATCHING,

          nextStatus:
            AnimeListStatus
              .WATCHING,

          previousProgressEpisodes:
            3,

          nextProgressEpisodes:
            4,
        });
      },
    );

    it(
      'does not invoke activity generation for score-only updates',
      async () => {
        const {
          service:
            activityEvents,

          recordTrackingUpdateBestEffort,
        } =
          createActivityEvents();

        const prisma = {
          anime: {
            findFirst:
              jest.fn(
                async () => ({
                  id:
                    ANIME_ID,

                  episodes: 12,
                }),
              ),
          },

          animeListEntry: {
            findUnique:
              jest.fn(
                async () => ({
                  status:
                    AnimeListStatus
                      .WATCHING,

                  progressEpisodes:
                    4,

                  score: null,

                  rewatchCount:
                    0,

                  startedAt:
                    new Date(),

                  completedAt:
                    null,
                }),
              ),

            upsert:
              jest.fn(
                async () =>
                  createEntry(
                    AnimeListStatus
                      .WATCHING,
                    4,
                  ),
              ),
          },
        } as unknown as
          PrismaService;

        const service =
          new AnimeTrackingService(
            prisma,
            undefined,
            activityEvents,
          );

        await service.upsert(
          USER_ID,
          {
            animeId:
              ANIME_ID,

            score: 8.5,
          },
        );

        expect(
          recordTrackingUpdateBestEffort,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
