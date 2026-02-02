"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrGetDirectConversation = exports.restoreConversationForMe = exports.deleteConversationForMe = exports.markConversationRead = exports.unarchiveConversation = exports.archiveConversation = exports.getMessages = exports.listConversations = void 0;
const prismaClient_1 = __importDefault(require("../../config/prismaClient"));
const client_1 = require("@prisma/client");
const pickOtherParticipant = (participants, myUserId) => {
    const other = participants.find((p) => p.user?.id !== myUserId)?.user;
    return other ?? null;
};
const listConversations = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const archived = String(req.query.archived ?? "false") === "true";
        const myParticipants = await prismaClient_1.default.conversationParticipant.findMany({
            where: { user_id: userId, is_archived: archived, is_deleted: false },
            include: {
                conversation: {
                    include: {
                        participants: { include: { user: true } },
                        messages: { orderBy: { created_at: "desc" }, take: 1 },
                    },
                },
            },
            orderBy: { conversation: { created_at: "desc" } },
        });
        const rows = await Promise.all(myParticipants.map(async (p) => {
            const conv = p.conversation;
            const lastMessage = conv.messages[0] ?? null;
            const unreadCount = await prismaClient_1.default.messageStatus.count({
                where: {
                    user_id: userId,
                    status: { not: "read" },
                    message: { conversation_id: conv.id },
                },
            });
            const other = pickOtherParticipant(conv.participants, userId);
            return {
                id: conv.id,
                isGroup: conv.is_group,
                title: conv.title,
                lastMessage: lastMessage
                    ? {
                        id: lastMessage.id,
                        content: lastMessage.content,
                        type: lastMessage.message_type,
                        createdAt: lastMessage.created_at,
                        senderId: lastMessage.sender_id,
                    }
                    : null,
                unreadCount,
                participantState: {
                    isArchived: p.is_archived,
                    lastReadAt: p.last_read_at,
                },
                otherUser: other
                    ? {
                        id: other.id,
                        username: other.username,
                        display_name: other.display_name,
                        avatar_url: other.avatar_url,
                    }
                    : null,
                createdAt: conv.created_at,
            };
        }));
        return res.json({ conversations: rows });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.listConversations = listConversations;
const getMessages = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const conversationId = req.params.conversationId;
        const limit = Math.min(Number(req.query.limit ?? 30) || 30, 100);
        const cursor = req.query.cursor ?? null;
        const participant = await prismaClient_1.default.conversationParticipant.findUnique({
            where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
        });
        if (!participant)
            return res.status(403).json({ message: "Forbidden" });
        if (participant.is_deleted)
            return res.status(404).json({ message: "Not Found" });
        const messages = await prismaClient_1.default.message.findMany({
            where: {
                conversation_id: conversationId,
                NOT: {
                    statuses: {
                        some: {
                            user_id: userId,
                            is_hidden: true,
                        },
                    },
                },
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
        const hasMore = messages.length > limit;
        const page = hasMore ? messages.slice(0, limit) : messages;
        const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;
        return res.json({
            messages: page.map((m) => ({
                id: m.id,
                conversationId: m.conversation_id,
                senderId: m.sender_id,
                content: m.content,
                type: m.message_type,
                payload: m.payload,
                isEdited: m.is_edited,
                isDeleted: m.is_deleted,
                deletedForAll: m.deleted_for_all,
                createdAt: m.created_at,
                updatedAt: m.updated_at,
            })),
            nextCursor,
        });
    }
    catch {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.getMessages = getMessages;
const archiveConversation = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const conversationId = req.params.conversationId;
        await prismaClient_1.default.conversationParticipant.update({
            where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
            data: { is_archived: true, archived_at: new Date() },
        });
        return res.json({ success: true });
    }
    catch {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.archiveConversation = archiveConversation;
const unarchiveConversation = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const conversationId = req.params.conversationId;
        await prismaClient_1.default.conversationParticipant.update({
            where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
            data: { is_archived: false, archived_at: null },
        });
        return res.json({ success: true });
    }
    catch {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.unarchiveConversation = unarchiveConversation;
const markConversationRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const conversationId = req.params.conversationId;
        const participant = await prismaClient_1.default.conversationParticipant.findUnique({
            where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
        });
        if (!participant)
            return res.status(403).json({ message: "Forbidden" });
        if (participant.is_deleted)
            return res.status(404).json({ message: "Not Found" });
        await prismaClient_1.default.conversationParticipant.update({
            where: { id: participant.id },
            data: { last_read_at: new Date() },
        });
        await prismaClient_1.default.messageStatus.updateMany({
            where: {
                user_id: userId,
                status: { not: "read" },
                message: { conversation_id: conversationId },
            },
            data: { status: "read" },
        });
        return res.json({ success: true });
    }
    catch {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.markConversationRead = markConversationRead;
const deleteConversationForMe = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const conversationId = req.params.conversationId;
        const participant = await prismaClient_1.default.conversationParticipant.findUnique({
            where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
        });
        if (!participant)
            return res.status(403).json({ message: "Forbidden" });
        await prismaClient_1.default.conversationParticipant.update({
            where: { id: participant.id },
            data: { is_deleted: true, deleted_at: new Date() },
        });
        return res.json({ success: true });
    }
    catch {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.deleteConversationForMe = deleteConversationForMe;
const restoreConversationForMe = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const conversationId = req.params.conversationId;
        const participant = await prismaClient_1.default.conversationParticipant.findUnique({
            where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
        });
        if (!participant)
            return res.status(403).json({ message: "Forbidden" });
        await prismaClient_1.default.conversationParticipant.update({
            where: { id: participant.id },
            data: { is_deleted: false, deleted_at: null },
        });
        return res.json({ success: true });
    }
    catch {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.restoreConversationForMe = restoreConversationForMe;
const createOrGetDirectConversation = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const otherUserId = String(req.body?.userId ?? "");
        if (!otherUserId)
            return res.status(400).json({ message: "Missing userId" });
        if (otherUserId === userId)
            return res.status(400).json({ message: "Invalid userId" });
        // Canonicalize the pair so (A,B) == (B,A)
        const [a, b] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];
        const otherUser = await prismaClient_1.default.user.findUnique({ where: { id: otherUserId } });
        if (!otherUser)
            return res.status(404).json({ message: "User not found" });
        const blocked = await prismaClient_1.default.block.findFirst({
            where: {
                OR: [
                    { blocker_id: userId, blocked_id: otherUserId },
                    { blocker_id: otherUserId, blocked_id: userId },
                ],
            },
        });
        if (blocked)
            return res.status(403).json({ message: "Forbidden" });
        // Race-safe: the database enforces uniqueness for a direct pair (a,b).
        // If two requests try to create the same pair concurrently, one will win and the other will re-fetch.
        const conversationId = await prismaClient_1.default.$transaction(async (tx) => {
            // NOTE: These fields/unique constraint are introduced by a Prisma migration.
            // Until `prisma generate` is run, TS types won't include them, so we use `as any`.
            const conversationModel = tx.conversation;
            const existing = await conversationModel.findUnique({
                where: {
                    direct_user_a_id_direct_user_b_id: {
                        direct_user_a_id: a,
                        direct_user_b_id: b,
                    },
                },
                select: { id: true },
            });
            if (existing?.id) {
                await tx.conversationParticipant.updateMany({
                    where: {
                        conversation_id: existing.id,
                        user_id: userId,
                    },
                    data: { is_deleted: false, deleted_at: null, is_archived: false, archived_at: null },
                });
                return existing.id;
            }
            try {
                const created = await conversationModel.create({
                    data: {
                        is_group: false,
                        direct_user_a_id: a,
                        direct_user_b_id: b,
                        participants: {
                            create: [{ user_id: userId }, { user_id: otherUserId }],
                        },
                    },
                    select: { id: true },
                });
                return created.id;
            }
            catch (err) {
                // Unique collision (another request created it first)
                if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                    const again = await conversationModel.findUnique({
                        where: {
                            direct_user_a_id_direct_user_b_id: {
                                direct_user_a_id: a,
                                direct_user_b_id: b,
                            },
                        },
                        select: { id: true },
                    });
                    if (again?.id)
                        return again.id;
                }
                throw err;
            }
        });
        const conv = await prismaClient_1.default.conversation.findUnique({
            where: { id: conversationId },
            include: {
                participants: { include: { user: true } },
                messages: { orderBy: { created_at: "desc" }, take: 1 },
            },
        });
        if (!conv)
            return res.status(500).json({ message: "Internal Server Error" });
        const other = pickOtherParticipant(conv.participants, userId);
        return res.json({
            conversation: {
                id: conv.id,
                isGroup: conv.is_group,
                title: conv.title,
                otherUser: other
                    ? {
                        id: other.id,
                        username: other.username,
                        display_name: other.display_name,
                        avatar_url: other.avatar_url,
                    }
                    : null,
                createdAt: conv.created_at,
            },
        });
    }
    catch {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.createOrGetDirectConversation = createOrGetDirectConversation;
