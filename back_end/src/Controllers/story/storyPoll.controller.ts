import type { Request, Response } from "express";
import { StoryPollService } from "../../services/storyPoll.service";
import { AppError } from "../../util/error";

export class StoryPollController {
  /** POST /stories/:id/poll  { overlay_id, option_index } */
  static async vote(req: Request, res: Response) {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { overlay_id, option_index } = req.body ?? {};
    if (typeof overlay_id !== "string") throw new AppError("overlay_id is required", 400);
    const data = await StoryPollService.vote(
      req.params.id as string,
      req.user.id,
      overlay_id,
      Number(option_index)
    );
    return res.status(201).json({ success: true, data });
  }

  /** GET /stories/:id/poll/:overlayId */
  static async results(req: Request, res: Response) {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const data = await StoryPollService.getResults(
      req.params.id as string,
      req.params.overlayId as string,
      req.user.id
    );
    return res.json({ success: true, data });
  }
}
