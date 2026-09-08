import type { Request, Response } from "express";
import { HighlightService } from "../../services/highlight.service";
import { AppError } from "../../util/error";

const requireUser = (req: Request) => {
  if (!req.user) throw new AppError("Utilisateur non authentifié", 401);
  return req.user.id;
};

export class HighlightController {
  /** POST /stories/highlights  { title, cover_url?, story_ids? } */
  static async create(req: Request, res: Response) {
    const userId = requireUser(req);
    const data = await HighlightService.create(userId, req.body ?? {});
    return res.status(201).json({ success: true, data });
  }

  /** GET /stories/highlights/user/:userId */
  static async listForUser(req: Request, res: Response) {
    const data = await HighlightService.listForUser(req.params.userId as string);
    return res.json({ success: true, data });
  }

  /** GET /stories/highlights/:id */
  static async getById(req: Request, res: Response) {
    const data = await HighlightService.getById(req.params.id as string);
    return res.json({ success: true, data });
  }

  /** PATCH /stories/highlights/:id  { title?, cover_url?, story_ids? } */
  static async update(req: Request, res: Response) {
    const userId = requireUser(req);
    const data = await HighlightService.update(req.params.id as string, userId, req.body ?? {});
    return res.json({ success: true, data });
  }

  /** POST /stories/highlights/:id/items  { story_ids: [] } */
  static async addItems(req: Request, res: Response) {
    const userId = requireUser(req);
    const storyIds = Array.isArray(req.body?.story_ids) ? req.body.story_ids : [];
    if (storyIds.length === 0) throw new AppError("story_ids requis", 400);
    const result = await HighlightService.addItems(req.params.id as string, userId, storyIds);
    return res.status(201).json({ success: true, ...result });
  }

  /** DELETE /stories/highlights/:id/items/:storyId */
  static async removeItem(req: Request, res: Response) {
    const userId = requireUser(req);
    const result = await HighlightService.removeItem(
      req.params.id as string,
      userId,
      req.params.storyId as string
    );
    return res.json({ success: true, ...result });
  }

  /** DELETE /stories/highlights/:id */
  static async remove(req: Request, res: Response) {
    const userId = requireUser(req);
    const result = await HighlightService.remove(req.params.id as string, userId);
    return res.json({ success: true, ...result });
  }
}
