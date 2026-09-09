import prisma from '../util/prisma';
import { AppError } from '../util/error';
import { StoryService } from './story.service';
import { NotificationService } from '../services/notificationService';

export class StoryCommentService {
  /**
   * Ajoute un commentaire à une story
   */
  static async commentStory(
    storyId: string,
    userId: string,
    content: string
  ) {
    // Vérifier que la story existe et est visible
    const story = await StoryService.getStoryById(storyId, userId);

    // Créer le commentaire
    const comment = await prisma.storyComment.create({
      data: {
        story_id: storyId,
        user_id: userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
    });

    // Créer une notification pour le créateur (si ce n'est pas lui-même)
    if (story.user_id !== userId) {
      await NotificationService.createStoryCommentNotification(
        story.user_id,
        userId,
        storyId,
        comment.id
      );
    }

    return comment;
  }

  /**
   * Récupère les commentaires d'une story
   */
  static async getStoryComments(storyId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new AppError('Story not found', 404);
    }

    const comments = await prisma.storyComment.findMany({
      where: {
        story_id: storyId,
        is_deleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    return comments;
  }

  /**
   * Supprime un commentaire (seul l'auteur peut le faire)
   */
  static async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.storyComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.user_id !== userId) {
      throw new AppError('You are not allowed to delete this comment', 403);
    }

    await prisma.storyComment.update({
      where: { id: commentId },
      data: { is_deleted: true },
    });

    return { message: 'Comment deleted' };
  }
}

