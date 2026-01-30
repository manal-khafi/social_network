import prisma from '../util/prisma';

export class NotificationService {
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

    await prisma.notification.create({
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

    await prisma.notification.create({
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

    await prisma.notification.create({
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

    await prisma.notification.create({
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
}