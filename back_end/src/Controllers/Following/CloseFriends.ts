import type { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { AppError } from "../../util/error";

const userSelect = {
  id: true,
  username: true,
  display_name: true,
  avatar_url: true,
} as const;

export const CloseFriendsController = {
  /** GET /follow/close-friends — people the current user marked as close friends. */
  async list(req: Request, res: Response) {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const rows = await prisma.closeFriend.findMany({
      where: { user_id: req.user.id },
      include: { closeFriend: { select: userSelect } },
      orderBy: { created_at: "desc" },
    });
    return res.json({ success: true, data: rows.map((r) => r.closeFriend) });
  },

  /** PUT /follow/close-friends/:userId — add someone to the close friends list. */
  async add(req: Request, res: Response) {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const targetId = req.params.userId as string;
    if (targetId === req.user.id) {
      throw new AppError("You cannot add yourself", 400);
    }
    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!target) throw new AppError("User not found", 404);

    await prisma.closeFriend.upsert({
      where: {
        user_id_close_friend_id: { user_id: req.user.id, close_friend_id: targetId },
      },
      update: {},
      create: { user_id: req.user.id, close_friend_id: targetId },
    });
    return res.status(201).json({ success: true, message: "Added to close friends" });
  },

  /** DELETE /follow/close-friends/:userId — remove someone from the list. */
  async remove(req: Request, res: Response) {
    if (!req.user) throw new AppError("Not authenticated", 401);
    await prisma.closeFriend.deleteMany({
      where: { user_id: req.user.id, close_friend_id: req.params.userId as string },
    });
    return res.json({ success: true, message: "Removed from close friends" });
  },
};
