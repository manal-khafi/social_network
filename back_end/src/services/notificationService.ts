import type { Prisma } from '@prisma/client';
import prisma from '../util/prisma';
import { emitToUser } from '../realtime/io';
import { logger } from '../util/logger';
import { getBlockedUserIds } from './BlockService';

/** Socket event pushed to the recipient when a notification is created. */
export const NEW_NOTIFICATION_EVENT = 'new_notification';

/** Activity notifications (posts, comments, follows). Stored in TypeNotification.code. */
export type ActivityNotificationType =
  | 'like'
  | 'comment'
  | 'reply'
  | 'follow'
  | 'follow_request'
  | 'follow_accepted'
  | 'repost'
  | 'mention';

const ACTIVITY_TYPES: Record<
  ActivityNotificationType,
  { name: string; description: string; title: string; text: (actor: string, target: string) => string }
> = {
  like: {
    name: 'Like',
    description: 'Someone liked your post or comment',
    title: 'New like',
    text: (actor, target) => `${actor} liked your ${target}`,
  },
  comment: {
    name: 'Comment',
    description: 'Someone commented on your post',
    title: 'New comment',
    text: (actor) => `${actor} commented on your post`,
  },
  reply: {
    name: 'Reply',
    description: 'Someone replied to your comment',
    title: 'New reply',
    text: (actor) => `${actor} replied to your comment`,
  },
  follow: {
    name: 'Follow',
    description: 'Someone started following you',
    title: 'New follower',
    text: (actor) => `${actor} started following you`,
  },
  follow_request: {
    name: 'Follow request',
    description: 'Someone asked to follow you',
    title: 'New follow request',
    text: (actor) => `${actor} requested to follow you`,
  },
  follow_accepted: {
    name: 'Follow request accepted',
    description: 'Your follow request was accepted',
    title: 'Follow request accepted',
    text: (actor) => `${actor} accepted your follow request`,
  },
  repost: {
    name: 'Repost',
    description: 'Someone reposted your post',
    title: 'New repost',
    text: (actor) => `${actor} reposted your post`,
  },
  mention: {
    name: 'Mention',
    description: 'Someone mentioned you in a comment',
    title: 'New mention',
    text: (actor) => `${actor} mentioned you in a comment`,
  },
};

// Types where repeating the same action (like / unlike / like ...) must not
// stack up notifications while the previous one is still unread.
const DEDUPED_TYPES: ActivityNotificationType[] = ['like', 'repost', 'follow', 'follow_request'];

const MAX_MENTIONS = 10;

/** Socket event pushed when notifications are withdrawn (unlike, unfollow, ...). */
export const NOTIFICATION_REMOVED_EVENT = 'notification_removed';

// Which of the recipient's preferences (User.allow_*_notifications) gates each type.
const PREFERENCE_FIELD = {
  like: 'allow_like_notifications',
  comment: 'allow_comment_notifications',
  reply: 'allow_comment_notifications',
  mention: 'allow_mention_notifications',
  follow: 'allow_follow_notifications',
  follow_request: 'allow_follow_notifications',
  follow_accepted: 'allow_follow_notifications',
  repost: 'allow_repost_notifications',
} as const satisfies Record<ActivityNotificationType, string>;

const actorSelect = { id: true, username: true, display_name: true, avatar_url: true } as const;

type NotificationRow = Prisma.NotificationGetPayload<{
  include: { typeNotification: { select: { code: true } } };
}>;

/** Who triggered the notification. Older story notifications use per-type keys. */
const actorIdOf = (metadata: unknown): string | null => {
  if (!metadata || typeof metadata !== 'object') return null;
  const m = metadata as Record<string, unknown>;
  const id = m.actor_id ?? m.viewer_id ?? m.sender_id ?? m.liker_id ?? m.commenter_id;
  return typeof id === 'string' ? id : null;
};

export class NotificationService {
  /**
   * Turns DB rows into the payload shared by the REST API and the socket
   * event, resolving every actor with a single query.
   */
  static async shape(rows: NotificationRow[]) {
    const actorIds = [...new Set(rows.map((r) => actorIdOf(r.metadata)).filter((id): id is string => !!id))];
    const actors = actorIds.length
      ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: actorSelect })
      : [];
    const actorById = new Map(actors.map((a) => [a.id, a]));

    return rows.map((r) => {
      const actorId = actorIdOf(r.metadata);
      return {
        id: r.id,
        type: r.typeNotification.code,
        title: r.title,
        message: r.message,
        isRead: r.is_read,
        createdAt: r.created_at.toISOString(),
        sourceId: r.source_id,
        sourceType: r.source_type,
        metadata: r.metadata,
        actor: (actorId && actorById.get(actorId)) || null,
      };
    });
  }

  /** Persist a notification row and push it live to the recipient (if online). */
  private static async persist(args: { data: any }) {
    const notification = await prisma.notification.create({
      ...args,
      include: { typeNotification: { select: { code: true } } },
    });
    const [payload] = await NotificationService.shape([notification]);
    emitToUser(notification.user_id, NEW_NOTIFICATION_EVENT, payload);
    return notification;
  }

  private static async createActivity(
    type: ActivityNotificationType,
    params: {
      recipientId: string;
      actorId: string;
      sourceId: string;
      sourceType: 'post' | 'comment' | 'user';
      metadata?: Record<string, unknown>;
    }
  ) {
    const { recipientId, actorId, sourceId, sourceType } = params;
    // Never notify people about their own actions.
    if (!recipientId || !actorId || recipientId === actorId) return;

    // Respect the recipient's notification settings.
    const preferenceField = PREFERENCE_FIELD[type];
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { [preferenceField]: true } as Prisma.UserSelect,
    });
    if (!recipient || (recipient as Record<string, unknown>)[preferenceField] === false) return;

    const def = ACTIVITY_TYPES[type];
    const typeRow = await prisma.typeNotification.upsert({
      where: { code: type },
      update: {},
      create: { code: type, name: def.name, description: def.description },
    });

    if (DEDUPED_TYPES.includes(type)) {
      const existing = await prisma.notification.findFirst({
        where: {
          user_id: recipientId,
          type_notification_id: typeRow.id,
          source_id: sourceId,
          is_read: false,
          metadata: { path: ['actor_id'], equals: actorId },
        },
        select: { id: true },
      });
      if (existing) return;
    }

    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { username: true, display_name: true },
    });
    const actorName = actor?.display_name || actor?.username || 'Someone';

    await NotificationService.persist({
      data: {
        user_id: recipientId,
        type_notification_id: typeRow.id,
        source_id: sourceId,
        source_type: sourceType,
        title: def.title,
        message: def.text(actorName, sourceType === 'comment' ? 'comment' : 'post'),
        metadata: { actor_id: actorId, ...params.metadata },
      },
    });
  }

  /**
   * Fire-and-forget entry point for controllers: returns immediately and never
   * throws, so a notification failure can neither slow down nor break the
   * action (like, comment, follow, ...) that triggered it.
   */
  static notify(
    type: ActivityNotificationType,
    params: {
      recipientId: string;
      actorId: string;
      sourceId: string;
      sourceType: 'post' | 'comment' | 'user';
      metadata?: Record<string, unknown>;
    }
  ): void {
    NotificationService.createActivity(type, params).catch((err) => {
      logger.warn({ err, type, recipientId: params.recipientId }, 'failed to create notification');
    });
  }

  /**
   * Fire-and-forget: notifies every @username mentioned in a comment, except
   * the author, anyone in `excludeUserIds` (e.g. the post owner, who already
   * gets the comment notification), users who turned mentions off, and users
   * blocked either way.
   */
  static notifyMentions(params: {
    actorId: string;
    content: string;
    postId: string;
    commentId: string;
    excludeUserIds?: string[];
  }): void {
    const run = async () => {
      const usernames = [
        ...new Set(Array.from(params.content.matchAll(/(?:^|[^\w@])@([A-Za-z0-9_.]{1,30})/g), (m) => m[1].replace(/\.+$/, '')).filter(Boolean)),
      ].slice(0, MAX_MENTIONS);
      if (usernames.length === 0) return;

      const blockedIds = await getBlockedUserIds(params.actorId);
      const excluded = new Set([params.actorId, ...(params.excludeUserIds ?? []), ...blockedIds]);

      const users = await prisma.user.findMany({
        where: { username: { in: usernames }, is_active: true, allow_mentions: true },
        select: { id: true },
      });

      await Promise.all(
        users
          .filter((u) => !excluded.has(u.id))
          .map((u) =>
            NotificationService.createActivity('mention', {
              recipientId: u.id,
              actorId: params.actorId,
              sourceId: params.postId,
              sourceType: 'post',
              metadata: { post_id: params.postId, comment_id: params.commentId },
            })
          )
      );
    };

    run().catch((err) => {
      logger.warn({ err, commentId: params.commentId }, 'failed to create mention notifications');
    });
  }

  /**
   * Fire-and-forget undo: deletes the notification(s) of the given type(s)
   * that `actorId` generated about `targetId` (the post, comment or followed
   * user), e.g. after an unlike / un-repost / unfollow. Recipients who are
   * online are told so the item disappears without a refresh.
   */
  static removeNotification(
    type: ActivityNotificationType | ActivityNotificationType[],
    actorId: string,
    targetId: string
  ): void {
    const run = async () => {
      if (!actorId || !targetId) return;
      const codes = Array.isArray(type) ? type : [type];

      const rows = await prisma.notification.findMany({
        where: {
          typeNotification: { code: { in: codes } },
          source_id: targetId,
          metadata: { path: ['actor_id'], equals: actorId },
        },
        select: { id: true, user_id: true },
      });
      if (rows.length === 0) return;

      await prisma.notification.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });

      const idsByUser = new Map<string, string[]>();
      for (const r of rows) {
        idsByUser.set(r.user_id, [...(idsByUser.get(r.user_id) ?? []), r.id]);
      }
      for (const [userId, ids] of idsByUser) {
        emitToUser(userId, NOTIFICATION_REMOVED_EVENT, {
          ids,
          count: await NotificationService.unreadCount(userId),
        });
      }
    };

    run().catch((err) => {
      logger.warn({ err, type, actorId, targetId }, 'failed to remove notification');
    });
  }

  static unreadCount(userId: string) {
    return prisma.notification.count({ where: { user_id: userId, is_read: false } });
  }

  /**
   * Crée une notification pour une vue de story
   */
  static async createStoryViewNotification(
    storyOwnerId: string,
    viewerId: string,
    storyId: string
  ) {
    // Récupérer ou créer le type de notification pour les vues de stories
    let typeNotification = await prisma.typeNotification.findUnique({
      where: { code: 'story_view' },
    });

    if (!typeNotification) {
      typeNotification = await prisma.typeNotification.create({
        data: {
          code: 'story_view',
          name: 'Story view',
          description: 'Someone viewed your story',
        },
      });
    }

    const viewer = await prisma.user.findUnique({
      where: { id: viewerId },
      select: { username: true, display_name: true },
    });

    await NotificationService.persist({
      data: {
        user_id: storyOwnerId,
        type_notification_id: typeNotification.id,
        source_id: storyId,
        source_type: 'story',
        title: 'New view on your story',
        message: `${viewer?.display_name || viewer?.username || 'Someone'} viewed your story`,
        metadata: {
          viewer_id: viewerId,
          story_id: storyId,
        },
      },
    });
  }

  /**
   * Crée une notification pour un like sur une story
   */
  static async createStoryLikeNotification(
    storyOwnerId: string,
    likerId: string,
    storyId: string
  ) {
    let typeNotification = await prisma.typeNotification.findUnique({
      where: { code: 'story_like' },
    });

    if (!typeNotification) {
      typeNotification = await prisma.typeNotification.create({
        data: {
          code: 'story_like',
          name: 'Story like',
          description: 'Someone liked your story',
        },
      });
    }

    const liker = await prisma.user.findUnique({
      where: { id: likerId },
      select: { username: true, display_name: true },
    });

    await NotificationService.persist({
      data: {
        user_id: storyOwnerId,
        type_notification_id: typeNotification.id,
        source_id: storyId,
        source_type: 'story',
        title: 'New like on your story',
        message: `${liker?.display_name || liker?.username || 'Someone'} liked your story`,
        metadata: {
          liker_id: likerId,
          story_id: storyId,
        },
      },
    });
  }

  /**
   * Crée une notification pour un commentaire sur une story
   */
  static async createStoryCommentNotification(
    storyOwnerId: string,
    commenterId: string,
    storyId: string,
    commentId: string
  ) {
    let typeNotification = await prisma.typeNotification.findUnique({
      where: { code: 'story_comment' },
    });

    if (!typeNotification) {
      typeNotification = await prisma.typeNotification.create({
        data: {
          code: 'story_comment',
          name: 'Story comment',
          description: 'Someone commented on your story',
        },
      });
    }

    const commenter = await prisma.user.findUnique({
      where: { id: commenterId },
      select: { username: true, display_name: true },
    });

    await NotificationService.persist({
      data: {
        user_id: storyOwnerId,
        type_notification_id: typeNotification.id,
        source_id: storyId,
        source_type: 'story',
        title: 'New comment on your story',
        message: `${commenter?.display_name || commenter?.username || 'Someone'} commented on your story`,
        metadata: {
          commenter_id: commenterId,
          story_id: storyId,
          comment_id: commentId,
        },
      },
    });
  }

  /**
   * Crée une notification pour un message privé lié à une story
   */
  static async createStoryMessageNotification(
    storyOwnerId: string,
    senderId: string,
    storyId: string,
    messageId: string
  ) {
    let typeNotification = await prisma.typeNotification.findUnique({
      where: { code: 'story_message' },
    });

    if (!typeNotification) {
      typeNotification = await prisma.typeNotification.create({
        data: {
          code: 'story_message',
          name: 'Story message',
          description: 'Someone replied to your story',
        },
      });
    }

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { username: true, display_name: true },
    });

    await NotificationService.persist({
      data: {
        user_id: storyOwnerId,
        type_notification_id: typeNotification.id,
        source_id: storyId,
        source_type: 'story',
        title: 'New message on your story',
        message: `${sender?.display_name || sender?.username || 'Someone'} sent you a message`,
        metadata: {
          sender_id: senderId,
          story_id: storyId,
          message_id: messageId,
        },
      },
    });
  }

  /**
   * Generic helper: ensure a notification type exists then create the row.
   */
  private static async notifyStory(
    code: string,
    name: string,
    description: string,
    params: {
      recipientId: string;
      actorId: string;
      sourceId: string;
      title: string;
      message: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    let type = await prisma.typeNotification.findUnique({ where: { code } });
    if (!type) {
      type = await prisma.typeNotification.create({ data: { code, name, description } });
    }

    await NotificationService.persist({
      data: {
        user_id: params.recipientId,
        type_notification_id: type.id,
        source_id: params.sourceId,
        source_type: 'story',
        title: params.title,
        message: params.message,
        metadata: { actor_id: params.actorId, story_id: params.sourceId, ...params.metadata },
      },
    });
  }

  /**
   * Notification for an emoji reaction on a story.
   */
  static async createStoryReactionNotification(
    storyOwnerId: string,
    actorId: string,
    storyId: string,
    emoji: string
  ) {
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { username: true, display_name: true },
    });
    const name = actor?.display_name || actor?.username || 'Someone';
    await this.notifyStory(
      'story_reaction',
      'Story reaction',
      'Someone reacted to your story',
      {
        recipientId: storyOwnerId,
        actorId,
        sourceId: storyId,
        title: 'New reaction on your story',
        message: `${name} reacted ${emoji} to your story`,
        metadata: { emoji },
      }
    );
  }

  /**
   * Notification when someone shares your story to a DM.
   */
  static async createStoryShareNotification(
    storyOwnerId: string,
    actorId: string,
    storyId: string
  ) {
    if (storyOwnerId === actorId) return;
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { username: true, display_name: true },
    });
    const name = actor?.display_name || actor?.username || 'Someone';
    await this.notifyStory(
      'story_share',
      'Story share',
      'Someone shared your story',
      {
        recipientId: storyOwnerId,
        actorId,
        sourceId: storyId,
        title: 'Your story was shared',
        message: `${name} shared your story`,
      }
    );
  }

  /**
   * Notification when someone re-shares your post/story into their own story.
   */
  static async createStoryReshareNotification(
    originalOwnerId: string,
    actorId: string,
    newStoryId: string
  ) {
    if (originalOwnerId === actorId) return;
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { username: true, display_name: true },
    });
    const name = actor?.display_name || actor?.username || 'Someone';
    await this.notifyStory(
      'story_reshare',
      'Story reshare',
      'Someone reshared your content to their story',
      {
        recipientId: originalOwnerId,
        actorId,
        sourceId: newStoryId,
        title: 'Your content was reshared to a story',
        message: `${name} added your content to their story`,
      }
    );
  }
}