import type { Request, Response } from "express";
import prisma from "../../config/prismaClient";
import { Prisma } from "@prisma/client";

const pickOtherParticipant = (participants: Array<{ user: any }>, myUserId: string) => {
  const other = participants.find((p) => p.user?.id !== myUserId)?.user;
  return other ?? null;
};

export const listConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const archived = String(req.query.archived ?? "false") === "true";

    const myParticipants = await prisma.conversationParticipant.findMany({
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

    const rows = await Promise.all(
      myParticipants.map(async (p) => {
        const conv = p.conversation;
        const lastMessage = conv.messages[0] ?? null;
        const unreadCount = await prisma.messageStatus.count({
          where: {
            user_id: userId,
            status: { not: "read" },
            message: { conversation_id: conv.id },
          },
        });

        const other = pickOtherParticipant(conv.participants as any, userId);

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
      })
    );

    return res.json({ conversations: rows });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const conversationId = req.params.conversationId;
    const limit = Math.min(Number(req.query.limit ?? 30) || 30, 100);
    const cursor = (req.query.cursor as string | undefined) ?? null;

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
    });
    if (!participant) return res.status(403).json({ message: "Forbidden" });
    if (participant.is_deleted) return res.status(404).json({ message: "Not Found" });

    const messages = await prisma.message.findMany({
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
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const archiveConversation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const conversationId = req.params.conversationId;
    await prisma.conversationParticipant.update({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
      data: { is_archived: true, archived_at: new Date() },
    });

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const unarchiveConversation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const conversationId = req.params.conversationId;
    await prisma.conversationParticipant.update({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
      data: { is_archived: false, archived_at: null },
    });

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const markConversationRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const conversationId = req.params.conversationId;

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
    });
    if (!participant) return res.status(403).json({ message: "Forbidden" });
    if (participant.is_deleted) return res.status(404).json({ message: "Not Found" });

    await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { last_read_at: new Date() },
    });

    await prisma.messageStatus.updateMany({
      where: {
        user_id: userId,
        status: { not: "read" },
        message: { conversation_id: conversationId },
      },
      data: { status: "read" },
    });

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteConversationForMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const conversationId = req.params.conversationId;

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
    });
    if (!participant) return res.status(403).json({ message: "Forbidden" });

    await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { is_deleted: true, deleted_at: new Date() },
    });

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const restoreConversationForMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const conversationId = req.params.conversationId;

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
    });
    if (!participant) return res.status(403).json({ message: "Forbidden" });

    await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { is_deleted: false, deleted_at: null },
    });

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createOrGetDirectConversation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const otherUserId = String(req.body?.userId ?? "");
    if (!otherUserId) return res.status(400).json({ message: "Missing userId" });
    if (otherUserId === userId) return res.status(400).json({ message: "Invalid userId" });

    // Canonicalize the pair so (A,B) == (B,A)
    const [a, b] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];

    const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } });
    if (!otherUser) return res.status(404).json({ message: "User not found" });

    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blocker_id: userId, blocked_id: otherUserId },
          { blocker_id: otherUserId, blocked_id: userId },
        ],
      },
    });
    if (blocked) return res.status(403).json({ message: "Forbidden" });

    // Race-safe: the database enforces uniqueness for a direct pair (a,b).
    // If two requests try to create the same pair concurrently, one will win and the other will re-fetch.
    const conversationId = await prisma.$transaction(async (tx) => {
      // NOTE: These fields/unique constraint are introduced by a Prisma migration.
      // Until `prisma generate` is run, TS types won't include them, so we use `as any`.
      const conversationModel = tx.conversation as any;

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
          } as any,
          select: { id: true },
        });
        return created.id;
      } catch (err) {
        // Unique collision (another request created it first)
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          const again = await conversationModel.findUnique({
            where: {
              direct_user_a_id_direct_user_b_id: {
                direct_user_a_id: a,
                direct_user_b_id: b,
              },
            },
            select: { id: true },
          });
          if (again?.id) return again.id;
        }
        throw err;
      }
    });

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: { include: { user: true } },
        messages: { orderBy: { created_at: "desc" }, take: 1 },
      },
    });
    if (!conv) return res.status(500).json({ message: "Internal Server Error" });

    const other = pickOtherParticipant(conv.participants as any, userId);

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
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
