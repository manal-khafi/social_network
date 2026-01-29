import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { StoryService } from '../services/story.service';
import { AppError } from '../utils/errors';

export class StoryController {
  /**
   * Crée une nouvelle story
   * POST /stories
   */
  static async createStory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const story = await StoryService.createStory(req.user.id, req.body);

      return res.status(201).json({
        success: true,
        message: 'Story créée avec succès',
        data: story,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère toutes les stories visibles par l'utilisateur
   * GET /stories
   */
  static async getVisibleStories(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const stories = await StoryService.getVisibleStories(req.user.id);

      return res.status(200).json({
        success: true,
        data: stories,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère une story spécifique
   * GET /stories/:id
   */
  static async getStoryById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const story = await StoryService.getStoryById(req.params.id, req.user.id);

      return res.status(200).json({
        success: true,
        data: story,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les stories d'un utilisateur spécifique
   * GET /stories/user/:userId
   */
  static async getUserStories(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const stories = await StoryService.getUserStories(
        req.params.userId,
        req.user.id
      );

      return res.status(200).json({
        success: true,
        data: stories,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprime une story
   * DELETE /stories/:id
   */
  static async deleteStory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const result = await StoryService.deleteStory(req.params.id, req.user.id);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      throw error;
    }
  }
}

