"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllNotificationsRead = exports.markNotificationRead = exports.getUnreadNotificationCount = exports.createNotification = void 0;
const prismaClient_1 = __importDefault(require("../../dist/config/prismaClient"));
const ensureTypeNotification = async (code) => {
    const existing = await prismaClient_1.default.typeNotification.findUnique({ where: { code } });
    if (existing)
        return existing;
    const nameMap = {
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
    return prismaClient_1.default.typeNotification.create({
        data: {
            code,
            name: nameMap[code],
        },
    });
};
const createNotification = async (args) => {
    const type = await ensureTypeNotification(args.code);
    return prismaClient_1.default.notification.create({
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
exports.createNotification = createNotification;
const getUnreadNotificationCount = async (userId) => {
    return prismaClient_1.default.notification.count({ where: { user_id: userId, is_read: false } });
};
exports.getUnreadNotificationCount = getUnreadNotificationCount;
const markNotificationRead = async (args) => {
    const existing = await prismaClient_1.default.notification.findFirst({
        where: { id: args.notificationId, user_id: args.userId },
        select: { id: true, is_read: true },
    });
    if (!existing)
        return { ok: false, notFound: true };
    if (existing.is_read)
        return { ok: true, alreadyRead: true };
    await prismaClient_1.default.notification.update({
        where: { id: args.notificationId },
        data: { is_read: true, read_at: new Date() },
    });
    return { ok: true };
};
exports.markNotificationRead = markNotificationRead;
const markAllNotificationsRead = async (args) => {
    await prismaClient_1.default.notification.updateMany({
        where: { user_id: args.userId, is_read: false },
        data: { is_read: true, read_at: new Date() },
    });
    return { ok: true };
};
exports.markAllNotificationsRead = markAllNotificationsRead;
