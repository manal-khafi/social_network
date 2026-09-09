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
      throw new AppError("Not authenticated", 401);
    }

    const { content } = req.body;

    const comment = await StoryCommentService.commentStory(
      (req.params.id as string),
      req.user.id,
      content
    );

    return res.status(201).json({
      success: true,
      message: "Comment added",
      data: comment,
    });
  }

  /**
   * Récupère les commentaires d'une story
   * GET /stories/:id/comments
   */
  static async getStoryComments(req: Request, res: Response) {
    const comments = await StoryCommentService.getStoryComments((req.params.id as string));

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
      throw new AppError("Not authenticated", 401);
    }

    const result = await StoryCommentService.deleteComment(
      (req.params.commentId as string),
      req.user.id
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  }
}
