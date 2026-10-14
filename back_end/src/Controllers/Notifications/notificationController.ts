import type { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { NotificationService } from "../../services/notificationService";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * GET /api/notifications?limit=20&cursor=<id of the last item of the previous page>
 * Newest first. `nextCursor` is null when there is nothing more to load.
 */
export const listNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    const limitParam = Number(req.query.limit);
    const limit =
      Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), MAX_LIMIT) : DEFAULT_LIMIT;
    const cursor = typeof req.query.cursor === "string" && req.query.cursor ? req.query.cursor : null;

    const rows = await prisma.notification.findMany({
      where: { user_id: userId },
      include: { typeNotification: { select: { code: true } } },
      // id breaks ties so the cursor is stable for rows created in the same ms
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return res.status(200).json({
      success: true,
      notifications: await NotificationService.shape(page),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (error) {
    console.error("listNotifications error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** GET /api/notifications/unread-count */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    return res.status(200).json({ count: await NotificationService.unreadCount(userId) });
  } catch (error) {
    console.error("getUnreadCount error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** PATCH /api/notifications/:id/read */
export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    // Scoped to the owner: someone else's notification id behaves as "not found".
    const existing = await prisma.notification.findFirst({
      where: { id: req.params.id, user_id: userId },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ success: false, message: "Notification not found" });

    await prisma.notification.update({ where: { id: existing.id }, data: { is_read: true } });

    return res.status(200).json({ success: true, count: await NotificationService.unreadCount(userId) });
  } catch (error) {
    console.error("markNotificationRead error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** PATCH /api/notifications/read-all */
export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });

    return res.status(200).json({ success: true, count: 0 });
  } catch (error) {
    console.error("markAllNotificationsRead error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** DELETE /api/notifications/:id */
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    const deleted = await prisma.notification.deleteMany({
      where: { id: req.params.id, user_id: userId },
    });
    if (deleted.count === 0) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.status(200).json({ success: true, count: await NotificationService.unreadCount(userId) });
  } catch (error) {
    console.error("deleteNotification error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
