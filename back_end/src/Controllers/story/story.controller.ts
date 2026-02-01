import type { Request, Response } from "express";
import { StoryService } from "../../services/story.service";
import { AppError } from "../../util/error";

export class StoryController {
  static async createStory(req: Request, res: Response) {
    if (!req.user) throw new AppError("Utilisateur non authentifié", 401);

    const story = await StoryService.createStory(req.user.id, req.body);

    return res.status(201).json({
      success: true,
      message: "Story créée avec succès",
      data: story,
    });
  }

  static async getVisibleStories(req: Request, res: Response) {
    if (!req.user) throw new AppError("Utilisateur non authentifié", 401);

    const stories = await StoryService.getVisibleStories(req.user.id);

    return res.status(200).json({ success: true, data: stories });
  }

  static async getStoryById(req: Request, res: Response) {
    if (!req.user) throw new AppError("Utilisateur non authentifié", 401);
    if (typeof req.params.id !== 'string') {
        return res.status(400).json({ message: "Invalid ID" });
    }
    const story = await StoryService.getStoryById(req.params.id, req.user.id);

    return res.status(200).json({ success: true, data: story });
  }

  static async getUserStories(req: Request, res: Response) {
    if (!req.user) throw new AppError("Utilisateur non authentifié", 401);
    if (typeof req.params.userId !== 'string') {
        return res.status(400).json({ message: "Invalid user ID" });
    }
    const stories = await StoryService.getUserStories(req.params.userId, req.user.id);

    return res.status(200).json({ success: true, data: stories });
  }

  static async deleteStory(req: Request, res: Response) {
    if (!req.user) throw new AppError("Utilisateur non authentifié", 401);
    if (typeof req.params.id !== 'string') {
        return res.status(400).json({ message: "Invalid ID" });
    }
    const result = await StoryService.deleteStory(req.params.id, req.user.id);

    return res.status(200).json({ success: true, ...result });
  }
}
