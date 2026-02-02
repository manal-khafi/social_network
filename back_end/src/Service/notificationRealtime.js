"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitNotificationNew = exports.mapNotification = void 0;
const ioContext_1 = require("../sockets/ioContext");
const notificationService_1 = require("./notificationService");
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
exports.mapNotification = mapNotification;
const emitNotificationNew = async (args) => {
    const io = (0, ioContext_1.getSocketServer)();
    if (!io)
        return;
    const unreadCount = await (0, notificationService_1.getUnreadNotificationCount)(args.receiverId);
    io.to(userRoom(args.receiverId)).emit("notification:new", {
        kind: args.kind,
        ...(args.extra ?? {}),
        notification: (0, exports.mapNotification)(args.notification),
        unreadCount,
    });
};
exports.emitNotificationNew = emitNotificationNew;
