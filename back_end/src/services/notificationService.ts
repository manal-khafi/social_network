import prisma from '../util/prisma';
import { emitToUser } from '../realtime/io';

export class NotificationService {
  /** Persist a notification row and push it live to the recipient. */
  private static async persist(args: { data: any }) {
    const notification = await prisma.notification.create(args);
    emitToUser(notification.user_id, 'notification:new', notification);
    return notification;
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
  private static async notify(
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
    await this.notify(
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
    await this.notify(
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
    await this.notify(
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