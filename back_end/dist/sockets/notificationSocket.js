"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNotificationSocket = void 0;
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const notificationService_1 = require("../../src/Service/notificationService");
const userRoom = (userId) => `user:${userId}`;
const mapNotification = (n) => ({
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
const registerNotificationSocket = (io, socket) => {
    const userId = socket.data.user?.id;
    if (!userId)
        return;
    // Ensure the user is in their personal room for realtime updates.
    socket.join(userRoom(userId));
    socket.on("notification:unreadCount", async (ack) => {
        try {
            const unreadCount = await (0, notificationService_1.getUnreadNotificationCount)(userId);
            socket.emit("notification:unreadCount", { unreadCount });
            if (ack)
                ack({ ok: true, unreadCount });
        }
        catch {
            if (ack)
                ack({ ok: false });
        }
    });
    socket.on("notification:read", async (payload, ack) => {
        try {
            const notificationId = payload?.notificationId;
            if (!notificationId) {
                if (ack)
                    ack({ ok: false });
                return;
            }
            const existing = await prismaClient_1.default.notification.findFirst({
                where: { id: notificationId, user_id: userId },
                include: {
                    typeNotification: { select: { code: true, name: true } },
                    sender: { select: { id: true, username: true, display_name: true, avatar_url: true } },
                },
            });
            if (!existing) {
                if (ack)
                    ack({ ok: false, notFound: true });
                return;
            }
            const updated = existing.is_read
                ? existing
                : await prismaClient_1.default.notification.update({
                    where: { id: notificationId },
                    data: { is_read: true, read_at: new Date() },
                    include: {
                        typeNotification: { select: { code: true, name: true } },
                        sender: { select: { id: true, username: true, display_name: true, avatar_url: true } },
                    },
                });
            const unreadCount = await (0, notificationService_1.getUnreadNotificationCount)(userId);
            io.to(userRoom(userId)).emit("notification:read", {
                notificationId: updated.id,
                notification: mapNotification(updated),
                unreadCount,
            });
            if (ack)
                ack({ ok: true, unreadCount });
        }
        catch {
            if (ack)
                ack({ ok: false });
        }
    });
    socket.on("notification:readAll", async (_payload, ack) => {
        try {
            await prismaClient_1.default.notification.updateMany({
                where: { user_id: userId, is_read: false },
                data: { is_read: true, read_at: new Date() },
            });
            io.to(userRoom(userId)).emit("notification:readAll", { unreadCount: 0 });
            if (ack)
                ack({ ok: true, unreadCount: 0 });
        }
        catch {
            if (ack)
                ack({ ok: false });
        }
    });
};
exports.registerNotificationSocket = registerNotificationSocket;
