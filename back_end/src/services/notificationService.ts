import prisma from "../config/prismaClient";

export type NotificationCode =
  // Posts
  | "POST_LIKED"
  | "POST_COMMENTED"
  | "COMMENT_REPLIED"
  | "POST_REPOSTED"
  | "POST_MENTION"
  | "COMMENT_MENTION"
  | "FOLLOWED_USER_POSTED"

  // Social
  | "FOLLOW_REQUEST"
  | "FOLLOW_ACCEPTED"
  | "FOLLOW_REJECTED"
  | "USER_FOLLOWED"

  | "INBOX_MESSAGE_NEW"
  | "INBOX_MESSAGE_EDITED"
  | "INBOX_MESSAGE_DELETED"
  | "CALL_INCOMING"
  | "CALL_ACCEPTED"
  | "CALL_REJECTED"
  | "CALL_ENDED"

  // System
  | "SYSTEM_WELCOME"
  | "SYSTEM_ALERT";

const ensureTypeNotification = async (code: NotificationCode) => {
  const existing = await prisma.typeNotification.findUnique({ where: { code } });
  if (existing) return existing;

  const nameMap: Record<NotificationCode, string> = {
    POST_LIKED: "Post liked",
    POST_COMMENTED: "New comment",
    COMMENT_REPLIED: "New reply",
    POST_REPOSTED: "Post reposted",
    POST_MENTION: "Mention",
    COMMENT_MENTION: "Mention",
    FOLLOWED_USER_POSTED: "New post",

    FOLLOW_REQUEST: "Follow request",
    FOLLOW_ACCEPTED: "Follow request accepted",
    FOLLOW_REJECTED: "Follow request rejected",
    USER_FOLLOWED: "New follower",

    INBOX_MESSAGE_NEW: "New message",
    INBOX_MESSAGE_EDITED: "Message edited",
    INBOX_MESSAGE_DELETED: "Message deleted",
    CALL_INCOMING: "Incoming call",
    CALL_ACCEPTED: "Call accepted",
    CALL_REJECTED: "Call rejected",
    CALL_ENDED: "Call ended",

    SYSTEM_WELCOME: "Welcome",
    SYSTEM_ALERT: "System alert",
  };

  return prisma.typeNotification.create({
    data: {
      code,
      name: nameMap[code],
    },
  });
};

export const createNotification = async (args: {
  userId: string; // receiver
  code: NotificationCode;
  title: string;
  message: string;
  senderId?: string;
  sourceId?: string;
  sourceType?: string;
  metadata?: any;
}) => {
  const type = await ensureTypeNotification(args.code);

  return prisma.notification.create({
    data: {
      user_id: args.userId,
      type_notification_id: type.id,
      title: args.title,
      message: args.message,
      source_id: args.sourceId ?? null,
      source_type: args.sourceType ?? null,
      metadata: args.metadata ?? null,
      sender_id: args.senderId ?? null,
    },
    include: {
      typeNotification: { select: { code: true, name: true } },
      sender: { select: { id: true, username: true, display_name: true, avatar_url: true } },
    },
  });
};

export const getUnreadNotificationCount = async (userId: string) => {
  return prisma.notification.count({ where: { user_id: userId, is_read: false } });
};

export const markNotificationRead = async (args: { userId: string; notificationId: string }) => {
  const existing = await prisma.notification.findFirst({
    where: { id: args.notificationId, user_id: args.userId },
    select: { id: true, is_read: true },
  });
  if (!existing) return { ok: false as const, notFound: true as const };
  if (existing.is_read) return { ok: true as const, alreadyRead: true as const };

  await prisma.notification.update({
    where: { id: args.notificationId },
    data: { is_read: true, read_at: new Date() },
  });

  return { ok: true as const };
};

export const markAllNotificationsRead = async (args: { userId: string }) => {
  await prisma.notification.updateMany({
    where: { user_id: args.userId, is_read: false },
    data: { is_read: true, read_at: new Date() },
  });
  return { ok: true as const };
};
