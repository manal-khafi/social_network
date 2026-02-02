import type { Server, Socket } from "socket.io";
import prisma from "../config/prismaClient";
import { createNotification, getUnreadNotificationCount } from "../Service/notificationService";

const userRoom = (userId: string) => `user:${userId}`;

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

type StartCallPayload = {
  calleeId: string;
  callType: "audio" | "video";
  conversationId?: string;
};

type SignalPayload = {
  callId: string;
  toUserId: string;
  data: any;
};

type OfferPayload = {
  callId: string;
  toUserId: string;
  sdp: any;
};

type AnswerPayload = {
  callId: string;
  toUserId: string;
  sdp: any;
};

type IceCandidatePayload = {
  callId: string;
  toUserId: string;
  candidate: any;
};

export const registerCallSocket = (io: Server, socket: Socket) => {
  const callerId = socket.data.user?.id;
  if (!callerId) return;

  socket.on("call:start", async (payload: StartCallPayload) => {
    try {
      const calleeId = payload?.calleeId;
      const callType = payload?.callType;
      if (!calleeId || (callType !== "audio" && callType !== "video")) return;
      if (calleeId === callerId) return;

      let allowed = false;

      // If conversationId is provided, allow calls when both users are participants.
      if (payload?.conversationId) {
        const participants = await prisma.conversationParticipant.findMany({
          where: {
            conversation_id: payload.conversationId,
            user_id: { in: [callerId, calleeId] },
            is_deleted: false,
          },
          select: { user_id: true },
        });
        allowed = participants.length === 2;
      }

      // Fallback: allow calls with accepted follow relation (either direction for now)
      if (!allowed) {
        const followAllowed = await prisma.follow.findFirst({
          where: {
            status: "accepted",
            OR: [
              { follower_id: callerId, followed_id: calleeId },
              { follower_id: calleeId, followed_id: callerId },
            ],
          },
        });
        allowed = Boolean(followAllowed);
      }

      if (!allowed) {
        socket.emit("call:error", { message: "FORBIDDEN" });
        return;
      }

      const call = await prisma.callLog.create({
        data: {
          caller_id: callerId,
          callee_id: calleeId,
          call_type: callType,
          status: "ringing",
          conversation_id: payload?.conversationId ?? null,
        },
      });

      socket.emit("call:ringing", { callId: call.id, calleeId, callType });

      io.to(userRoom(calleeId)).emit("call:incoming", {
        callId: call.id,
        fromUserId: callerId,
        callType,
        conversationId: payload?.conversationId ?? null,
      });

      const notif = await createNotification({
        userId: calleeId,
        code: "CALL_INCOMING",
        title: "Incoming call",
        message: "You have an incoming call",
        sourceId: call.id,
        sourceType: "call",
        senderId: callerId,
        metadata: {
          callId: call.id,
          fromUserId: callerId,
          conversationId: payload?.conversationId ?? null,
          callType,
        },
      });

      const unreadCount = await getUnreadNotificationCount(calleeId);

      io.to(userRoom(calleeId)).emit("notification:new", {
        kind: "call",
        callId: call.id,
        fromUserId: callerId,
        callType,
        notification: mapNotification(notif),
        unreadCount,
      });
    } catch {
      socket.emit("call:error", { message: "START_FAILED" });
    }
  });

  socket.on("call:accept", async (payload: { callId: string; otherUserId: string }) => {
    try {
      const callId = payload?.callId;
      const otherUserId = payload?.otherUserId;
      if (!callId || !otherUserId) return;

      await prisma.callLog.update({
        where: { id: callId },
        data: { status: "accepted", answered_at: new Date() },
      });

      io.to(userRoom(otherUserId)).emit("call:accepted", { callId, byUserId: callerId });

      const notif = await createNotification({
        userId: otherUserId,
        code: "CALL_ACCEPTED",
        title: "Call accepted",
        message: "Your call was accepted",
        sourceId: callId,
        sourceType: "call",
        senderId: callerId,
        metadata: { callId, byUserId: callerId },
      });

      const unreadCount = await getUnreadNotificationCount(otherUserId);
      io.to(userRoom(otherUserId)).emit("notification:new", {
        kind: "call_accepted",
        callId,
        byUserId: callerId,
        notification: mapNotification(notif),
        unreadCount,
      });
    } catch {
      socket.emit("call:error", { message: "ACCEPT_FAILED" });
    }
  });

  socket.on("call:reject", async (payload: { callId: string; otherUserId: string }) => {
    try {
      const callId = payload?.callId;
      const otherUserId = payload?.otherUserId;
      if (!callId || !otherUserId) return;

      await prisma.callLog.update({
        where: { id: callId },
        data: { status: "rejected", ended_at: new Date() },
      });

      io.to(userRoom(otherUserId)).emit("call:rejected", { callId, byUserId: callerId });

      const notif = await createNotification({
        userId: otherUserId,
        code: "CALL_REJECTED",
        title: "Call rejected",
        message: "Your call was rejected",
        sourceId: callId,
        sourceType: "call",
        senderId: callerId,
        metadata: { callId, byUserId: callerId },
      });

      const unreadCount = await getUnreadNotificationCount(otherUserId);
      io.to(userRoom(otherUserId)).emit("notification:new", {
        kind: "call_rejected",
        callId,
        byUserId: callerId,
        notification: mapNotification(notif),
        unreadCount,
      });
    } catch {
      socket.emit("call:error", { message: "REJECT_FAILED" });
    }
  });

  socket.on("call:end", async (payload: { callId: string; otherUserId: string }) => {
    try {
      const callId = payload?.callId;
      const otherUserId = payload?.otherUserId;
      if (!callId || !otherUserId) return;

      await prisma.callLog.update({
        where: { id: callId },
        data: { status: "ended", ended_at: new Date() },
      });

      io.to(userRoom(otherUserId)).emit("call:ended", { callId, byUserId: callerId });

      const notif = await createNotification({
        userId: otherUserId,
        code: "CALL_ENDED",
        title: "Call ended",
        message: "The call has ended",
        sourceId: callId,
        sourceType: "call",
        senderId: callerId,
        metadata: { callId, byUserId: callerId },
      });

      const unreadCount = await getUnreadNotificationCount(otherUserId);
      io.to(userRoom(otherUserId)).emit("notification:new", {
        kind: "call_ended",
        callId,
        byUserId: callerId,
        notification: mapNotification(notif),
        unreadCount,
      });
    } catch {
      socket.emit("call:error", { message: "END_FAILED" });
    }
  });

  // WebRTC signalling relay
  socket.on("call:signal", (payload: SignalPayload) => {
    const callId = payload?.callId;
    const toUserId = payload?.toUserId;
    if (!callId || !toUserId) return;

    io.to(userRoom(toUserId)).emit("call:signal", {
      callId,
      fromUserId: callerId,
      data: payload?.data ?? null,
    });
  });

  // Explicit WebRTC signalling events (preferred)
  socket.on("call:offer", (payload: OfferPayload) => {
    const callId = payload?.callId;
    const toUserId = payload?.toUserId;
    if (!callId || !toUserId) return;
    io.to(userRoom(toUserId)).emit("call:offer", {
      callId,
      fromUserId: callerId,
      sdp: payload?.sdp ?? null,
    });
  });

  socket.on("call:answer", (payload: AnswerPayload) => {
    const callId = payload?.callId;
    const toUserId = payload?.toUserId;
    if (!callId || !toUserId) return;
    io.to(userRoom(toUserId)).emit("call:answer", {
      callId,
      fromUserId: callerId,
      sdp: payload?.sdp ?? null,
    });
  });

  socket.on("call:ice-candidate", (payload: IceCandidatePayload) => {
    const callId = payload?.callId;
    const toUserId = payload?.toUserId;
    if (!callId || !toUserId) return;
    io.to(userRoom(toUserId)).emit("call:ice-candidate", {
      callId,
      fromUserId: callerId,
      candidate: payload?.candidate ?? null,
    });
  });
};
