import prisma from '../util/prisma';
import { AppError } from '../util/error';
import { RelationshipService } from './relationship.service';

export class StoryService {
  /**
   * Crée une nouvelle story avec calcul automatique de l'expiration
   */
  static async createStory(
    userId: string,
    data: {
      content_url: string;
      content_type: 'image' | 'video' | 'text' | 'link';
      visibility: 'public' | 'friends' | 'close_friends';
      duration_hours?: number;
    }
  ) {
    const durationHours = data.duration_hours || 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + durationHours);

    const story = await prisma.story.create({
      data: {
        content_url: data.content_url,
        content_type: data.content_type as any,
        visibility: data.visibility as any,
        duration_hours: durationHours,
        expires_at: expiresAt,
        user_id: userId,
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

    return story;
  }

  /**
   * Récupère toutes les stories visibles par un utilisateur (non expirées et selon visibilité)
   */
  static async getVisibleStories(userId: string) {
    const now = new Date();

    // Récupérer toutes les stories non expirées
    const allStories = await prisma.story.findMany({
      where: {
        expires_at: {
          gt: now,
        },
        is_archived: false,
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
        _count: {
          select: {
            views: true,
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Filtrer selon les règles de visibilité et vérifier les interactions de l'utilisateur
    const visibleStories = [];
    for (const story of allStories) {
      const canView = await RelationshipService.canViewStory(
        userId,
        story.user_id,
        story.visibility
      );

      if (canView) {
        // Vérifier si l'utilisateur a vu ou liké cette story
        const userView = await prisma.storyView.findUnique({
          where: {
            story_id_viewer_id: {
              story_id: story.id,
              viewer_id: userId,
            },
          },
        });

        const userLike = await prisma.storyLike.findUnique({
          where: {
            user_id_story_id: {
              user_id: userId,
              story_id: story.id,
            },
          },
        });

        visibleStories.push({
          ...story,
          has_viewed: !!userView,
          has_liked: !!userLike,
        });
      }
    }

    return visibleStories;
  }

  /**
   * Récupère une story spécifique avec vérification de visibilité
   */
  static async getStoryById(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
        _count: {
          select: {
            views: true,
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!story) {
      throw new AppError('Story non trouvée', 404);
    }

    // Vérifier si la story est expirée
    if (new Date() > story.expires_at) {
      throw new AppError('Cette story a expiré', 410);
    }

    // Vérifier la visibilité
    const canView = await RelationshipService.canViewStory(
      userId,
      story.user_id,
      story.visibility
    );

    if (!canView) {
      throw new AppError('Vous n\'avez pas accès à cette story', 403);
    }

    // Vérifier si l'utilisateur a vu ou liké cette story
    const userView = await prisma.storyView.findUnique({
      where: {
        story_id_viewer_id: {
          story_id: story.id,
          viewer_id: userId,
        },
      },
    });

    const userLike = await prisma.storyLike.findUnique({
      where: {
        user_id_story_id: {
          user_id: userId,
          story_id: story.id,
        },
      },
    });

    return {
      ...story,
      has_viewed: !!userView,
      has_liked: !!userLike,
    };
  }

  /**
   * Récupère les stories d'un utilisateur spécifique (non expirées)
   */
  static async getUserStories(ownerId: string, viewerId: string) {
    const now = new Date();

    const stories = await prisma.story.findMany({
      where: {
        user_id: ownerId,
        expires_at: {
          gt: now,
        },
        is_archived: false,
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
        _count: {
          select: {
            views: true,
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Filtrer selon la visibilité pour le viewer
    const visibleStories = [];
    for (const story of stories) {
      const canView = await RelationshipService.canViewStory(
        viewerId,
        story.user_id,
        story.visibility
      );

      if (canView || viewerId === ownerId) {
        // Vérifier si l'utilisateur a vu ou liké cette story
        const userView = await prisma.storyView.findUnique({
          where: {
            story_id_viewer_id: {
              story_id: story.id,
              viewer_id: viewerId,
            },
          },
        });

        const userLike = await prisma.storyLike.findUnique({
          where: {
            user_id_story_id: {
              user_id: viewerId,
              story_id: story.id,
            },
          },
        });

        visibleStories.push({
          ...story,
          has_viewed: !!userView,
          has_liked: !!userLike,
        });
      }
    }

    return visibleStories;
  }

  /**
   * Supprime une story (seul le créateur peut le faire)
   */
  static async deleteStory(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new AppError('Story non trouvée', 404);
    }

    if (story.user_id !== userId) {
      throw new AppError('Vous n\'êtes pas autorisé à supprimer cette story', 403);
    }

    await prisma.story.update({
      where: { id: storyId },
      data: { is_archived: true },
    });

    return { message: 'Story supprimée avec succès' };
  }

  /**
   * Vérifie et marque les stories expirées comme archivées (à appeler périodiquement)
   */
  static async archiveExpiredStories() {
    const now = new Date();

    const result = await prisma.story.updateMany({
      where: {
        expires_at: {
          lte: now,
        },
        is_archived: false,
      },
      data: {
        is_archived: true,
      },
    });

    return { archived_count: result.count };
  }
}

