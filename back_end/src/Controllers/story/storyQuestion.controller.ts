import type { Request, Response } from "express";
import { StoryQuestionService } from "../../services/storyQuestion.service";
import { AppError } from "../../util/error";

export class StoryQuestionController {
  /** POST /stories/:id/question  { overlay_id, answer } */
  static async respond(req: Request, res: Response) {
    if (!req.user) throw new AppError("Utilisateur non authentifié", 401);
    const { overlay_id, answer } = req.body ?? {};
    if (typeof overlay_id !== "string") throw new AppError("overlay_id requis", 400);
    const data = await StoryQuestionService.respond(
      req.params.id as string,
      req.user.id,
      overlay_id,
      String(answer ?? "")
    );
    return res.status(201).json({ success: true, data });
  }

  /** GET /stories/:id/question/:overlayId  (author only) */
  static async list(req: Request, res: Response) {
    if (!req.user) throw new AppError("Utilisateur non authentifié", 401);
    const data = await StoryQuestionService.list(
      req.params.id as string,
      req.params.overlayId as string,
      req.user.id
    );
    return res.json({ success: true, data });
  }
}
