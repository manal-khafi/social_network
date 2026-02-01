import type { Request, Response } from "express";
import { StoryCommentService } from "../../services/storyComment.service";
import { AppError } from "../../util/error";

export class StoryCommentController {
  /**
   * Ajoute un commentaire à une story
   * POST /stories/:id/comments
   */
  static async commentStory(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Utilisateur non authentifié", 401);
    }
    if (typeof req.params.id !== 'string') {
        return res.status(400).json({ message: "Invalid ID" });
    }

    const { content } = req.body;

    const comment = await StoryCommentService.commentStory(
      req.params.id,
      req.user.id,
      content
    );

    return res.status(201).json({
      success: true,
      message: "Commentaire ajouté avec succès",
      data: comment,
    });
  }

  /**
   * Récupère les commentaires d'une story
   * GET /stories/:id/comments
   */
  static async getStoryComments(req: Request, res: Response) {
    if (typeof req.params.id !== 'string') {
        return res.status(400).json({ message: "Invalid ID" });
    }
    const comments = await StoryCommentService.getStoryComments(req.params.id);

    return res.status(200).json({
      success: true,
      data: comments,
    });
  }

  /**
   * Supprime un commentaire
   * DELETE /stories/comments/:commentId
   */
  static async deleteComment(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Utilisateur non authentifié", 401);
    }
    if (typeof req.params.commentId !== 'string') {
        return res.status(400).json({ message: "Invalid ID" });
    }

    const result = await StoryCommentService.deleteComment(
      req.params.commentId,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  }
}
