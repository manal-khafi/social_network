import prisma from '../utils/prisma';
import { AppError } from '../utils/errors';
import { StoryService } from './story.service';
import { NotificationService } from './notification.service';

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
      return { message: 'Story déjà vue', view: existingView };
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
      throw new AppError('Story non trouvée', 404);
    }

    if (story.user_id !== userId) {
      throw new AppError('Vous n\'êtes pas autorisé à voir les vues de cette story', 403);
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

