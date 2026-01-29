import prisma from '../utils/prisma';
import { AppError } from '../utils/errors';
import { StoryService } from './story.service';
import { NotificationService } from './notification.service';

export class StoryLikeService {
  /**
   * Ajoute un like à une story (unique par utilisateur)
   */
  static async likeStory(storyId: string, userId: string) {
    // Vérifier que la story existe et est visible
    const story = await StoryService.getStoryById(storyId, userId);

    // Vérifier si l'utilisateur a déjà liké cette story
    const existingLike = await prisma.storyLike.findUnique({
      where: {
        user_id_story_id: {
          user_id: userId,
          story_id: storyId,
        },
      },
    });

    if (existingLike) {
      throw new AppError('Vous avez déjà aimé cette story', 400);
    }

    // Créer le like
    const like = await prisma.storyLike.create({
      data: {
        user_id: userId,
        story_id: storyId,
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
      await NotificationService.createStoryLikeNotification(
        story.user_id,
        userId,
        storyId
      );
    }

    return like;
  }

  /**
   * Retire un like d'une story
   */
  static async unlikeStory(storyId: string, userId: string) {
    const like = await prisma.storyLike.findUnique({
      where: {
        user_id_story_id: {
          user_id: userId,
          story_id: storyId,
        },
      },
    });

    if (!like) {
      throw new AppError('Vous n\'avez pas aimé cette story', 400);
    }

    await prisma.storyLike.delete({
      where: {
        user_id_story_id: {
          user_id: userId,
          story_id: storyId,
        },
      },
    });

    return { message: 'Like retiré avec succès' };
  }

  /**
   * Récupère les likes d'une story
   */
  static async getStoryLikes(storyId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new AppError('Story non trouvée', 404);
    }

    const likes = await prisma.storyLike.findMany({
      where: { story_id: storyId },
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
        created_at: 'desc',
      },
    });

    return likes;
  }
}

