import type { Request, Response } from "express";
import { StoryReactionService } from "../../services/storyReaction.service";
import { AppError } from "../../util/error";

export class StoryReactionController {
  /** POST /stories/:id/reactions  body: { emoji } */
  static async react(req: Request, res: Response) {
    if (!req.user) throw new AppError("Utilisateur non authentifié", 401);
    const reaction = await StoryReactionService.react(
      req.params.id as string,
      req.user.id,
      req.body.emoji
    );
    return res.status(201).json({ success: true, data: reaction });
  }

  /** DELETE /stories/:id/reactions */
  static async removeReaction(req: Request, res: Response) {
    if (!req.user) throw new AppError("Utilisateur non authentifié", 401);
    const result = await StoryReactionService.removeReaction(
      req.params.id as string,
      req.user.id
    );
    return res.status(200).json({ success: true, ...result });
  }

  /** GET /stories/:id/reactions  (author only) */
  static async getStoryReactions(req: Request, res: Response) {
    if (!req.user) throw new AppError("Utilisateur non authentifié", 401);
    const data = await StoryReactionService.getStoryReactions(
      req.params.id as string,
      req.user.id
    );
    return res.status(200).json({ success: true, data });
  }
}
