import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { StoryCommentService } from '../services/storyComment.service';
import { AppError } from '../utils/errors';

export class StoryCommentController {
  /**
   * Ajoute un commentaire à une story
   * POST /stories/:id/comments
   */
  static async commentStory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const { content } = req.body;

      const comment = await StoryCommentService.commentStory(
        req.params.id,
        req.user.id,
        content
      );

      return res.status(201).json({
        success: true,
        message: 'Commentaire ajouté avec succès',
        data: comment,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les commentaires d'une story
   * GET /stories/:id/comments
   */
  static async getStoryComments(req: AuthRequest, res: Response) {
    try {
      const comments = await StoryCommentService.getStoryComments(req.params.id);

      return res.status(200).json({
        success: true,
        data: comments,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprime un commentaire
   * DELETE /stories/comments/:commentId
   */
  static async deleteComment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const result = await StoryCommentService.deleteComment(
        req.params.commentId,
        req.user.id
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      throw error;
    }
  }
}

