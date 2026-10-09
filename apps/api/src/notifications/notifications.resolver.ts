import { UseGuards } from '@nestjs/common';
import { Args, Context, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { RequireAuthGuard } from '../auth/authorization/require-auth.guard.js';
import type { GraphQLAuthContext } from '../auth/auth.types.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationFeedInput, SocialNotificationPageType } from './notifications.graphql.js';

@Resolver()
@UseGuards(RequireAuthGuard)
export class NotificationsResolver {
  constructor(private readonly notifications: NotificationsService) {}

  @Query(() => SocialNotificationPageType)
  async myNotifications(
    @Context() context: GraphQLAuthContext,
    @Args('input', { type: () => NotificationFeedInput, nullable: true }) input?: NotificationFeedInput,
  ): Promise<SocialNotificationPageType> {
    try {
      return await this.notifications.feed(context.currentUser!.id, input);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Invalid notification')) {
        throw new GraphQLError(error.message, { extensions: { code: 'BAD_USER_INPUT' } });
      }
      throw error;
    }
  }

  @Query(() => Int)
  myUnreadNotificationCount(@Context() context: GraphQLAuthContext): Promise<number> {
    return this.notifications.unreadCount(context.currentUser!.id);
  }

  @Mutation(() => Boolean)
  markNotificationRead(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: GraphQLAuthContext,
  ): Promise<boolean> {
    return this.notifications.markRead(context.currentUser!.id, id);
  }

  @Mutation(() => Int)
  markAllNotificationsRead(@Context() context: GraphQLAuthContext): Promise<number> {
    return this.notifications.markAllRead(context.currentUser!.id);
  }

  @Mutation(() => Boolean)
  deleteMyNotification(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: GraphQLAuthContext,
  ): Promise<boolean> {
    return this.notifications.deleteMine(context.currentUser!.id, id);
  }
}
