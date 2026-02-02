import type { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { getUnreadNotificationCount } from "../../Service/notificationService";

export const listNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const limit = Math.min(Number(req.query.limit ?? 30) || 30, 100);
    const cursor = (req.query.cursor as string | undefined) ?? null;
    const unreadOnly = String(req.query.unreadOnly ?? "false") === "true";

    const notifications = await prisma.notification.findMany({
      where: {
        user_id: userId,
        ...(unreadOnly ? { is_read: false } : {}),
      },
      include: {
        typeNotification: { select: { code: true, name: true } },
        sender: { select: { id: true, username: true, display_name: true, avatar_url: true } },
      },
      orderBy: { created_at: "desc" },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = notifications.length > limit;
    const page = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

    return res.json({
      notifications: page.map((n) => ({
        id: n.id,
        code: n.typeNotification?.code ?? null,
        typeName: n.typeNotification?.name ?? null,
        title: n.title,
        message: n.message,
        isRead: n.is_read,
        readAt: (n as any).read_at ?? null,
        sender: n.sender
          ? {
              id: n.sender.id,
              username: n.sender.username,
              displayName: n.sender.display_name,
              avatarUrl: n.sender.avatar_url,
            }
          : null,
        sourceId: n.source_id,
        sourceType: n.source_type,
        metadata: n.metadata,
        createdAt: n.created_at,
      })),
      nextCursor,
    });
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUnreadNotificationsCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const unreadCount = await getUnreadNotificationCount(userId);
    return res.json({ unreadCount });
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const notificationId = req.params.notificationId;

    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, user_id: userId },
    });

    if (!existing) return res.status(404).json({ message: "Not Found" });

    await prisma.notification.update({
      where: { id: notificationId },
      data: { is_read: true, read_at: new Date() },
    });

    const unreadCount = await getUnreadNotificationCount(userId);
    return res.json({ success: true, unreadCount });
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true, read_at: new Date() },
    });

    return res.json({ success: true, unreadCount: 0 });
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
