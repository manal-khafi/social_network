import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { StoryViewService } from '../services/storyView.service';
import { AppError } from '../utils/errors';

export class StoryViewController {
  /**
   * Enregistre une vue sur une story
   * POST /stories/:id/view
   */
  static async viewStory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const view = await StoryViewService.viewStory(req.params.id, req.user.id);

      return res.status(200).json({
        success: true,
        message: 'Vue enregistrée avec succès',
        data: view,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les vues d'une story (créateur uniquement)
   * GET /stories/:id/views
   */
  static async getStoryViews(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const views = await StoryViewService.getStoryViews(req.params.id, req.user.id);

      return res.status(200).json({
        success: true,
        data: views,
      });
    } catch (error) {
      throw error;
    }
  }
}

