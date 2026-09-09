import type { Request, Response } from "express";
import { StoryLikeService } from "../../services/storyLike.service";
import { AppError } from "../../util/error";

export class StoryLikeController {
  /**
   * Ajoute un like à une story
   * POST /stories/:id/like
   */
  static async likeStory(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    const like = await StoryLikeService.likeStory((req.params.id as string), req.user.id);

    return res.status(201).json({
      success: true,
      message: "Story liked",
      data: like,
    });
  }

  /**
   * Retire un like d'une story
   * DELETE /stories/:id/like
   */
  static async unlikeStory(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    const result = await StoryLikeService.unlikeStory((req.params.id as string), req.user.id);

    return res.status(200).json({
      success: true,
      ...result,
    });
  }

  /**
   * Récupère les likes d'une story
   * GET /stories/:id/likes
   */
  static async getStoryLikes(req: Request, res: Response) {
    const likes = await StoryLikeService.getStoryLikes((req.params.id as string));

    return res.status(200).json({
      success: true,
      data: likes,
    });
  }
}
