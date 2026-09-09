import type { Request, Response } from "express";
import { StoryService } from "../../services/story.service";
import { AppError } from "../../util/error";

export class StoryController {
  static async createStory(req: Request, res: Response) {
    if (!req.user) throw new AppError("Not authenticated", 401);

    const story = await StoryService.createStory(req.user.id, req.body);

    return res.status(201).json({
      success: true,
      message: "Story created",
      data: story,
    });
  }

  /** GET /stories -> Instagram-style grouped feed (one entry per author). */
  static async getStoriesFeed(req: Request, res: Response) {
    if (!req.user) throw new AppError("Not authenticated", 401);

    const groups = await StoryService.getStoriesFeed(req.user.id);

    return res.status(200).json({ success: true, data: groups });
  }

  /** GET /stories/flat -> flat list (backwards compatible). */
  static async getVisibleStories(req: Request, res: Response) {
    if (!req.user) throw new AppError("Not authenticated", 401);

    const stories = await StoryService.getVisibleStories(req.user.id);

    return res.status(200).json({ success: true, data: stories });
  }

  static async getStoryById(req: Request, res: Response) {
    if (!req.user) throw new AppError("Not authenticated", 401);

    const story = await StoryService.getStoryById(req.params.id as string, req.user.id);

    return res.status(200).json({ success: true, data: story });
  }

  static async getUserStories(req: Request, res: Response) {
    if (!req.user) throw new AppError("Not authenticated", 401);

    const stories = await StoryService.getUserStories(
      req.params.userId as string,
      req.user.id
    );

    return res.status(200).json({ success: true, data: stories });
  }

  static async deleteStory(req: Request, res: Response) {
    if (!req.user) throw new AppError("Not authenticated", 401);

    const result = await StoryService.deleteStory(req.params.id as string, req.user.id);

    return res.status(200).json({ success: true, ...result });
  }
}
