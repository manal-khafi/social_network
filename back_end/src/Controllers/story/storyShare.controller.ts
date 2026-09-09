import type { Request, Response } from "express";
import { StoryShareService } from "../../services/storyShare.service";
import { AppError } from "../../util/error";

export class StoryShareController {
  /** POST /stories/:id/share  body: { recipient_ids: string[], note?: string } */
  static async shareToUsers(req: Request, res: Response) {
    if (!req.user) throw new AppError("Not authenticated", 401);

    const { recipient_ids, note } = req.body;
    const result = await StoryShareService.shareToUsers(
      req.params.id as string,
      req.user.id,
      Array.isArray(recipient_ids) ? recipient_ids : [],
      typeof note === "string" ? note : undefined
    );

    return res.status(201).json({
      success: true,
      message: `Story shared with ${result.shared_count} ${result.shared_count === 1 ? "person" : "people"}`,
      data: result,
    });
  }
}
