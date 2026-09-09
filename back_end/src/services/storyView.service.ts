import prisma from '../util/prisma';
import { AppError } from '../util/error';
import { StoryService } from './story.service';
import { NotificationService } from '../services/notificationService';
import { emitToUser } from '../realtime/io';

export class StoryViewService {
  /**
   * Enregistre une vue sur une story (unique par utilisateur)
   */
  static async viewStory(storyId: string, viewerId: string) {
    // Vérifier que la story existe et est visible
    const story = await StoryService.getStoryById(storyId, viewerId);

    // Vérifier si l'utilisateur a déjà vu cette story
    const existingView = await prisma.storyView.findUnique({
      where: {
        story_id_viewer_id: {
          story_id: storyId,
          viewer_id: viewerId,
        },
      },
    });

    if (existingView) {
      return { message: 'Story already viewed', view: existingView };
    }

    // Créer la vue
    const view = await prisma.storyView.create({
      data: {
        story_id: storyId,
        viewer_id: viewerId,
      },
    });

    // Créer une notification pour le créateur (si ce n'est pas lui-même)
    if (story.user_id !== viewerId) {
      await NotificationService.createStoryViewNotification(
        story.user_id,
        viewerId,
        storyId
      );

      const [viewer, viewCount] = await Promise.all([
        prisma.user.findUnique({
          where: { id: viewerId },
          select: { id: true, username: true, display_name: true, avatar_url: true },
        }),
        prisma.storyView.count({ where: { story_id: storyId } }),
      ]);

      emitToUser(story.user_id, 'story:view', {
        story_id: storyId,
        view_count: viewCount,
        viewer,
      });
    }

    return view;
  }

  /**
   * Récupère les vues d'une story (pour le créateur uniquement)
   */
  static async getStoryViews(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new AppError('Story not found', 404);
    }

    if (story.user_id !== userId) {
      throw new AppError('You are not allowed to see this story viewers', 403);
    }

    const views = await prisma.storyView.findMany({
      where: { story_id: storyId },
      include: {
        viewer: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
      orderBy: {
        viewed_at: 'desc',
      },
    });

    return views;
  }
}

