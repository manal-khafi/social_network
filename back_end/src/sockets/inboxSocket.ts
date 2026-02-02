import type { Server, Socket } from "socket.io";
import prisma from "../config/prismaClient";
import { getIsOnline } from "./presence";
import { createNotification, getUnreadNotificationCount } from "../Service/notificationService";

const conversationRoom = (conversationId: string) => `conversation:${conversationId}`;
const userRoom = (userId: string) => `user:${userId}`;

const getUnreadInboxCount = async (userId: string) => {
  return prisma.messageStatus.count({
    where: {
      user_id: userId,
      status: { not: "read" },
      is_hidden: false,
      // Exclude sender's own status rows
      message: { sender_id: { not: userId } },
    },
  });
};

const mapNotification = (n: any) => ({
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

const normalizeMessageType = (raw?: string) => {
  const t = String(raw ?? "text").toLowerCase();
  if (t === "voice") return "audio";
  if (t === "emoji" || t === "emojis") return "text";
  if (t === "poll" || t === "event") return "text";
  if (t === "audio") return "audio";
  if (t === "location") return "location";
  if (t === "sticker") return "sticker";
  if (t === "image") return "image";
  if (t === "video") return "video";
  if (t === "file") return "file";
  return "text";
};

type SendMessagePayload = {
  clientMessageId?: string;
  conversationId: string;
  type?: string;
  content?: string;
  payload?: any;
};

type EditMessagePayload = {
  conversationId: string;
  messageId: string;
  content?: string;
  payload?: any;
};

type DeleteMessagePayload = {
  conversationId: string;
  messageId: string;
  scope?: "all" | "self";
};

export const registerInboxSocket = (io: Server, socket: Socket) => {
  const userId = socket.data.user?.id;
  if (!userId) return;

  socket.join(userRoom(userId));

  // Emit initial unread count for badges
  getUnreadInboxCount(userId)
    .then((unreadCount) => {
      socket.emit("inbox:unreadCount", { unreadCount });
    })
    .catch(() => {
      // ignore
    });

  socket.on("inbox:unreadCount", async (ack?: (resp: any) => void) => {
    try {
      const unreadCount = await getUnreadInboxCount(userId);
      socket.emit("inbox:unreadCount", { unreadCount });
      if (ack) ack({ ok: true, unreadCount });
    } catch {
      if (ack) ack({ ok: false });
    }
  });

  // Mark pending messages as delivered now that user is online
  prisma.messageStatus
    .updateMany({
      where: {
        user_id: userId,
        status: "sent",
        is_hidden: false,
        message: {
          sender_id: { not: userId },
        },
      },
      data: { status: "delivered" },
    })
    .catch(() => {
      // ignore
    });

  socket.on("inbox:join", async ({ conversationId }: { conversationId: string }) => {
    if (!conversationId) return;

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
    });

    if (!participant) {
      socket.emit("inbox:error", { conversationId, message: "FORBIDDEN" });
      return;
    }

    if (participant.is_deleted) {
      socket.emit("inbox:error", { conversationId, message: "NOT_FOUND" });
      return;
    }

    socket.join(conversationRoom(conversationId));

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

    // Update unread badge after reading a conversation
    try {
      const unreadCount = await getUnreadInboxCount(userId);
      io.to(userRoom(userId)).emit("inbox:unreadCount", { unreadCount });
    } catch {
      // ignore
    }

    io.to(conversationRoom(conversationId)).emit("inbox:read", {
      conversationId,
      userId,
      at: new Date().toISOString(),
    });
  });

  socket.on("inbox:leave", ({ conversationId }: { conversationId: string }) => {
    if (!conversationId) return;
    socket.leave(conversationRoom(conversationId));
  });

  socket.on("inbox:typing", async (payload: { conversationId: string; isTyping: boolean }) => {
    const conversationId = payload?.conversationId;
    if (!conversationId) return;

    io.to(conversationRoom(conversationId)).except(socket.id).emit("inbox:typing", {
      conversationId,
      userId,
      isTyping: Boolean(payload?.isTyping),
    });
  });

  socket.on("inbox:message:send", async (payload: SendMessagePayload) => {
    try {
      const conversationId = payload?.conversationId;
      if (!conversationId) return;

      const participant = await prisma.conversationParticipant.findUnique({
        where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
      });
      if (!participant) {
        socket.emit("inbox:error", { conversationId, message: "FORBIDDEN" });
        return;
      }

      if (participant.is_deleted) {
        socket.emit("inbox:error", { conversationId, message: "NOT_FOUND" });
        return;
      }

      const msgType = normalizeMessageType(payload?.type) as any;

      const message = await prisma.message.create({
        data: {
          conversation_id: conversationId,
          sender_id: userId,
          content: payload?.content ?? null,
          message_type: msgType,
          payload: payload?.payload ?? null,
          statuses: {
            create: [
              {
                user_id: userId,
                status: "sent",
              },
            ],
          },
        },
      });

      const participants = await prisma.conversationParticipant.findMany({
        where: { conversation_id: conversationId },
        select: { user_id: true },
      });

      const participantRows = participants as Array<{ user_id: string }>;
      const recipientIds = participantRows.map((p: { user_id: string }) => p.user_id).filter((id: string) => id !== userId);

      if (recipientIds.length > 0) {
        await prisma.messageStatus.createMany({
          data: recipientIds.map((rid: string) => ({
            message_id: message.id,
            user_id: rid,
            status: getIsOnline(rid) ? "delivered" : "sent",
          })),
          skipDuplicates: true,
        });
      }

      io.to(conversationRoom(conversationId)).emit("inbox:message:new", {
        conversationId,
        message: {
          id: message.id,
          senderId: userId,
          content: message.content,
          type: message.message_type,
          payload: message.payload,
          createdAt: message.created_at,
          updatedAt: message.updated_at,
        },
        clientMessageId: payload?.clientMessageId ?? null,
      });

      // lightweight notifications for recipients
      for (const rid of recipientIds) {
        const notif = await createNotification({
          userId: rid,
          code: "INBOX_MESSAGE_NEW",
          title: "New message",
          message: "You received a new message",
          sourceId: message.id,
          sourceType: "message",
          senderId: userId,
          metadata: { conversationId, messageId: message.id, fromUserId: userId },
        });

        const unreadCount = await getUnreadNotificationCount(rid);

        io.to(userRoom(rid)).emit("notification:new", {
          kind: "message",
          conversationId,
          messageId: message.id,
          fromUserId: userId,
          notification: mapNotification(notif),
          unreadCount,
        });

        // Update Inbox unread badge in real-time
        try {
          const inboxUnread = await getUnreadInboxCount(rid);
          io.to(userRoom(rid)).emit("inbox:unreadCount", { unreadCount: inboxUnread });
        } catch {
          // ignore
        }
      }
    } catch (e) {
      socket.emit("inbox:error", { message: "SEND_FAILED" });
    }
  });

  socket.on(
    "inbox:poll:vote",
    async (payload: { conversationId: string; messageId: string; optionId: string | number }) => {
      try {
        const conversationId = payload?.conversationId;
        const messageId = payload?.messageId;
        const optionId = payload?.optionId;
        if (!conversationId || !messageId || optionId === undefined || optionId === null) return;

        const participant = await prisma.conversationParticipant.findUnique({
          where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
        });
        if (!participant || participant.is_deleted) return;

        const existing = await prisma.message.findUnique({ where: { id: messageId } });
        if (!existing || existing.conversation_id !== conversationId) return;

        const currentPayload: any = existing.payload ?? null;
        const poll = currentPayload?.poll;
        if (!poll || !Array.isArray(poll.options)) return;

        const voters: string[] = Array.isArray(poll.voters) ? poll.voters : [];
        if (voters.includes(userId)) return;

        const optIdStr = String(optionId);
        const nextOptions = poll.options.map((opt: any) => {
          if (String(opt?.id) !== optIdStr) return opt;
          const currentVotes = typeof opt?.votes === "number" ? opt.votes : 0;
          return { ...opt, votes: currentVotes + 1 };
        });

        // Ensure the option existed
        const hadOption = poll.options.some((opt: any) => String(opt?.id) === optIdStr);
        if (!hadOption) return;

        const nextPoll = {
          ...poll,
          options: nextOptions,
          totalVotes: (typeof poll.totalVotes === "number" ? poll.totalVotes : 0) + 1,
          voters: [...voters, userId],
        };

        const updated = await prisma.message.update({
          where: { id: messageId },
          data: {
            payload: {
              ...(currentPayload ?? {}),
              poll: nextPoll,
            },
          },
        });

        io.to(conversationRoom(conversationId)).emit("inbox:message:updated", {
          conversationId,
          message: {
            id: updated.id,
            content: updated.content,
            payload: updated.payload,
            updatedAt: updated.updated_at,
          },
        });
      } catch {
        socket.emit("inbox:error", { message: "POLL_VOTE_FAILED" });
      }
    }
  );

  socket.on("inbox:message:edit", async (payload: EditMessagePayload) => {
    try {
      const conversationId = payload?.conversationId;
      const messageId = payload?.messageId;
      if (!conversationId || !messageId) return;

      const existing = await prisma.message.findUnique({ where: { id: messageId } });
      if (!existing || existing.conversation_id !== conversationId) return;
      if (existing.sender_id !== userId) {
        socket.emit("inbox:error", { message: "FORBIDDEN" });
        return;
      }

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: {
          content: payload?.content ?? existing.content,
          payload: payload?.payload ?? existing.payload,
          is_edited: true,
        },
      });

      io.to(conversationRoom(conversationId)).emit("inbox:message:updated", {
        conversationId,
        message: {
          id: updated.id,
          content: updated.content,
          payload: updated.payload,
          isEdited: updated.is_edited,
          updatedAt: updated.updated_at,
        },
      });

      const participants = await prisma.conversationParticipant.findMany({
        where: { conversation_id: conversationId },
        select: { user_id: true },
      });
      const recipientIds = (participants as Array<{ user_id: string }>).map((p) => p.user_id).filter((id) => id !== userId);
      for (const rid of recipientIds) {
        const notif = await createNotification({
          userId: rid,
          code: "INBOX_MESSAGE_EDITED",
          title: "Message edited",
          message: "A message was edited",
          sourceId: updated.id,
          sourceType: "message",
          senderId: userId,
          metadata: { conversationId, messageId: updated.id, fromUserId: userId },
        });

        const unreadCount = await getUnreadNotificationCount(rid);
        io.to(userRoom(rid)).emit("notification:new", {
          kind: "message_edited",
          conversationId,
          messageId: updated.id,
          fromUserId: userId,
          notification: mapNotification(notif),
          unreadCount,
        });
      }
    } catch {
      socket.emit("inbox:error", { message: "EDIT_FAILED" });
    }
  });

  socket.on("inbox:message:delete", async (payload: DeleteMessagePayload) => {
    try {
      const conversationId = payload?.conversationId;
      const messageId = payload?.messageId;
      const scope = payload?.scope ?? "all";
      if (!conversationId || !messageId) return;

      const existing = await prisma.message.findUnique({ where: { id: messageId } });
      if (!existing || existing.conversation_id !== conversationId) return;
      if (existing.sender_id !== userId) {
        socket.emit("inbox:error", { message: "FORBIDDEN" });
        return;
      }

      if (scope === "all") {
        await prisma.message.update({
          where: { id: messageId },
          data: { is_deleted: true, deleted_for_all: true },
        });

        io.to(conversationRoom(conversationId)).emit("inbox:message:deleted", {
          conversationId,
          messageId,
          scope: "all",
        });

        const participants = await prisma.conversationParticipant.findMany({
          where: { conversation_id: conversationId },
          select: { user_id: true },
        });
        const recipientIds = (participants as Array<{ user_id: string }>).map((p) => p.user_id).filter((id) => id !== userId);
        for (const rid of recipientIds) {
          const notif = await createNotification({
            userId: rid,
            code: "INBOX_MESSAGE_DELETED",
            title: "Message deleted",
            message: "A message was deleted",
            sourceId: messageId,
            sourceType: "message",
            senderId: userId,
            metadata: { conversationId, messageId, fromUserId: userId },
          });

          const unreadCount = await getUnreadNotificationCount(rid);
          io.to(userRoom(rid)).emit("notification:new", {
            kind: "message_deleted",
            conversationId,
            messageId,
            fromUserId: userId,
            notification: mapNotification(notif),
            unreadCount,
          });
        }
      } else {
        await prisma.messageStatus.updateMany({
          where: { message_id: messageId, user_id: userId },
          data: { is_hidden: true, hidden_at: new Date() },
        });
        socket.emit("inbox:message:deleted", { conversationId, messageId, scope: "self" });
      }
    } catch {
      socket.emit("inbox:error", { message: "DELETE_FAILED" });
    }
  });
};
