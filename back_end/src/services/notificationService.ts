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
          name: 'Vue de story',
          description: 'Quelqu\'un a vu votre story',
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
        title: 'Nouvelle vue sur votre story',
        message: `${viewer?.display_name || viewer?.username || 'Quelqu\'un'} a vu votre story`,
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
          name: 'Like sur story',
          description: 'Quelqu\'un a aimé votre story',
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
        title: 'Nouveau like sur votre story',
        message: `${liker?.display_name || liker?.username || 'Quelqu\'un'} a aimé votre story`,
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
          name: 'Commentaire sur story',
          description: 'Quelqu\'un a commenté votre story',
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
        title: 'Nouveau commentaire sur votre story',
        message: `${commenter?.display_name || commenter?.username || 'Quelqu\'un'} a commenté votre story`,
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
          name: 'Message sur story',
          description: 'Quelqu\'un vous a envoyé un message en réponse à votre story',
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
        title: 'Nouveau message sur votre story',
        message: `${sender?.display_name || sender?.username || 'Quelqu\'un'} vous a envoyé un message`,
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
    const name = actor?.display_name || actor?.username || 'Quelqu\'un';
    await this.notify(
      'story_reaction',
      'Réaction sur story',
      'Quelqu\'un a réagi à votre story',
      {
        recipientId: storyOwnerId,
        actorId,
        sourceId: storyId,
        title: 'Nouvelle réaction sur votre story',
        message: `${name} a réagi ${emoji} à votre story`,
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
    const name = actor?.display_name || actor?.username || 'Quelqu\'un';
    await this.notify(
      'story_share',
      'Partage de story',
      'Quelqu\'un a partagé votre story',
      {
        recipientId: storyOwnerId,
        actorId,
        sourceId: storyId,
        title: 'Votre story a été partagée',
        message: `${name} a partagé votre story`,
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
    const name = actor?.display_name || actor?.username || 'Quelqu\'un';
    await this.notify(
      'story_reshare',
      'Repartage en story',
      'Quelqu\'un a repartagé votre contenu en story',
      {
        recipientId: originalOwnerId,
        actorId,
        sourceId: newStoryId,
        title: 'Votre contenu a été repartagé en story',
        message: `${name} a ajouté votre contenu à sa story`,
      }
    );
  }
}