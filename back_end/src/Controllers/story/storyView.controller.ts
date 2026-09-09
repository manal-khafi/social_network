import type { Request, Response } from "express";
import { StoryViewService } from "../../services/storyView.service";
import { AppError } from "../../util/error";

export class StoryViewController {
  static async viewStory(req: Request, res: Response) {
    if (!req.user) throw new AppError("Not authenticated", 401);

    const view = await StoryViewService.viewStory((req.params.id as string), req.user.id);

    return res.status(200).json({
      success: true,
      message: "View recorded",
      data: view,
    });
  }

  static async getStoryViews(req: Request, res: Response) {
    if (!req.user) throw new AppError("Not authenticated", 401);

    const views = await StoryViewService.getStoryViews((req.params.id as string), req.user.id);

    return res.status(200).json({
      success: true,
      data: views,
    });
  }
}
