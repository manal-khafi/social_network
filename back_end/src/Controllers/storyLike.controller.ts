import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { StoryLikeService } from '../services/storyLike.service';
import { AppError } from '../utils/errors';

export class StoryLikeController {
  /**
   * Ajoute un like à une story
   * POST /stories/:id/like
   */
  static async likeStory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const like = await StoryLikeService.likeStory(req.params.id, req.user.id);

      return res.status(201).json({
        success: true,
        message: 'Story aimée avec succès',
        data: like,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retire un like d'une story
   * DELETE /stories/:id/like
   */
  static async unlikeStory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const result = await StoryLikeService.unlikeStory(req.params.id, req.user.id);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les likes d'une story
   * GET /stories/:id/likes
   */
  static async getStoryLikes(req: AuthRequest, res: Response) {
    try {
      const likes = await StoryLikeService.getStoryLikes(req.params.id);

      return res.status(200).json({
        success: true,
        data: likes,
      });
    } catch (error) {
      throw error;
    }
  }
}

