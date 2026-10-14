import type { Request, Response } from "express";
import { PostShareService } from "../../services/postShare.service";
import { AppError } from "../../util/error";

/** POST /api/posts/:postId/share  body: { recipient_ids: string[], note?: string } */
export const sharePostToUsers = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Not authenticated", 401);

  const { recipient_ids, note } = req.body ?? {};
  const result = await PostShareService.shareToUsers(
    req.params.postId as string,
    req.user.id,
    Array.isArray(recipient_ids) ? recipient_ids : [],
    typeof note === "string" ? note : undefined
  );

  return res.status(201).json({ success: true, data: result });
};
