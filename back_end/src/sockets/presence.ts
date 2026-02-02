import type { Server, Socket } from "socket.io";

const connectionsByUser = new Map<string, Set<string>>();

export const getIsOnline = (userId: string): boolean => {
  return (connectionsByUser.get(userId)?.size ?? 0) > 0;
};

const getRoomForUserPresence = (userId: string) => `presence:${userId}`;

export const emitPresence = (io: Server, userId: string) => {
  io.to(getRoomForUserPresence(userId)).emit("presence:update", {
    userId,
    online: getIsOnline(userId),
  });
};

export const registerPresenceHandlers = (io: Server, socket: Socket) => {
  const userId = socket.data.user?.id;
  if (!userId) return;

  const previousOnline = getIsOnline(userId);
  const set = connectionsByUser.get(userId) ?? new Set<string>();
  set.add(socket.id);
  connectionsByUser.set(userId, set);

  if (!previousOnline) emitPresence(io, userId);

  socket.on("presence:subscribe", (payload: { userIds: string[] }) => {
    const ids = Array.isArray(payload?.userIds) ? payload.userIds : [];
    for (const id of ids) {
      if (typeof id !== "string" || id.length === 0) continue;
      socket.join(getRoomForUserPresence(id));
      socket.emit("presence:update", { userId: id, online: getIsOnline(id) });
    }
  });

  socket.on("disconnect", () => {
    const wasOnline = getIsOnline(userId);

    const current = connectionsByUser.get(userId);
    if (current) {
      current.delete(socket.id);
      if (current.size === 0) connectionsByUser.delete(userId);
    }

    const isOnlineNow = getIsOnline(userId);
    if (wasOnline && !isOnlineNow) emitPresence(io, userId);
  });
};
