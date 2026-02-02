import { getSocketServer } from "../sockets/ioContext";
import { getUnreadNotificationCount } from "./notificationService";

const userRoom = (userId: string) => `user:${userId}`;

export const mapNotification = (n: any) => ({
  id: n.id,
  code: n.typeNotification?.code ?? null,
  typeName: n.typeNotification?.name ?? null,
  title: n.title,
  message: n.message,
  isRead: Boolean(n.is_read),
  readAt: n.read_at ?? null,
  sender: n.sender
    ? {
        id: n.sender.id,
        username: n.sender.username,
        displayName: n.sender.display_name,
        avatarUrl: n.sender.avatar_url,
      }
    : null,
  sourceId: n.source_id ?? null,
  sourceType: n.source_type ?? null,
  metadata: n.metadata ?? null,
  createdAt: n.created_at,
});

export const emitNotificationNew = async (args: {
  receiverId: string;
  kind: string;
  notification: any;
  extra?: Record<string, any>;
}) => {
  const io = getSocketServer();
  if (!io) return;

  const unreadCount = await getUnreadNotificationCount(args.receiverId);

  io.to(userRoom(args.receiverId)).emit("notification:new", {
    kind: args.kind,
    ...(args.extra ?? {}),
    notification: mapNotification(args.notification),
    unreadCount,
  });
};
