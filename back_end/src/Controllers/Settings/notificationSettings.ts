import { Request, Response } from "express";
import prisma from "../../config/prismaClient";

// API name -> User column. The API keeps the short names the frontend
// settings slice already uses.
const FIELDS = {
  likes: "allow_like_notifications",
  comments: "allow_comment_notifications",
  follows: "allow_follow_notifications",
  mentions: "allow_mention_notifications",
  reposts: "allow_repost_notifications",
} as const;

type SettingKey = keyof typeof FIELDS;

const select = {
  allow_like_notifications: true,
  allow_comment_notifications: true,
  allow_follow_notifications: true,
  allow_mention_notifications: true,
  allow_repost_notifications: true,
} as const;

const toResponse = (user: Record<(typeof FIELDS)[SettingKey], boolean>) => ({
  likes: user.allow_like_notifications,
  comments: user.allow_comment_notifications,
  follows: user.allow_follow_notifications,
  mentions: user.allow_mention_notifications,
  reposts: user.allow_repost_notifications,
});

/** GET /api/notifications/settings */
export const getNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(toResponse(user));
  } catch (error) {
    console.error("Get notification settings error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/** PATCH /api/notifications/settings — body: any subset of { likes, comments, follows, mentions, reposts } */
export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data: Partial<Record<(typeof FIELDS)[SettingKey], boolean>> = {};
    for (const key of Object.keys(FIELDS) as SettingKey[]) {
      if (typeof body[key] === "boolean") data[FIELDS[key]] = body[key] as boolean;
    }

    const user = await prisma.user.update({ where: { id: userId }, data, select });

    return res.json(toResponse(user));
  } catch (error) {
    console.error("Update notification settings error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
