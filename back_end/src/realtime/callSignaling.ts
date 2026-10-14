import type { Server, Socket } from "socket.io";
import prisma from "../util/prisma";
import { logger } from "../util/logger";
import { getOrCreateDirectConversation } from "../util/conversation";

type CallStatus = "ended" | "missed" | "declined";

interface ActiveCall {
  caller: string;
  callee: string;
  type: "audio" | "video";
  // The exact sockets taking part. A user can have several tabs open: the
  // invite rings all of the callee's tabs, but once one answers, signaling is
  // pinned to that tab, and only these sockets disconnecting ends the call.
  callerSocket: string;
  calleeSocket?: string;
  acceptedAt?: number;
  // call:incoming is sent after an async user lookup, so the caller's first ICE
  // candidates can arrive before it. They are held here until the callee knows
  // about the call, otherwise the callee drops them as belonging to no call.
  delivered: boolean;
  pendingIce: unknown[];
  ringTimer?: NodeJS.Timeout;
}

// How long an unanswered call rings before it is reported as missed.
const RING_TIMEOUT_MS = 45_000;

// Process-local call state. Fine for a single backend instance; move to Redis
// if you scale horizontally.
const activeCalls = new Map<string, ActiveCall>();
const busy = new Map<string, string>(); // userId -> callId

async function persistCallLog(call: ActiveCall, status: CallStatus, io: Server) {
  try {
    const conv = await getOrCreateDirectConversation(call.caller, call.callee);
    const durationSec = call.acceptedAt ? Math.round((Date.now() - call.acceptedAt) / 1000) : 0;
    const message = await prisma.message.create({
      data: {
        conversation_id: conv.id,
        sender_id: call.caller,
        message_type: "call" as any,
        call_meta: { callType: call.type, status, durationSec } as any,
      },
      include: { sender: { select: { id: true, username: true, display_name: true, avatar_url: true } } },
    });
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { last_message_at: new Date() },
    });
    const payload = {
      id: message.id,
      conversation_id: conv.id,
      sender: message.sender,
      sender_id: message.sender_id,
      content: null,
      message_type: "call",
      call_meta: message.call_meta,
      created_at: message.created_at,
    };
    io.to(`user:${call.caller}`).emit("message:new", payload);
    io.to(`user:${call.callee}`).emit("message:new", payload);
  } catch (err) {
    logger.warn({ err }, "call log persistence failed");
  }
}

function teardown(callId: string, status: CallStatus, io: Server) {
  const call = activeCalls.get(callId);
  if (!call) return;
  if (call.ringTimer) clearTimeout(call.ringTimer);
  activeCalls.delete(callId);
  if (busy.get(call.caller) === callId) busy.delete(call.caller);
  if (busy.get(call.callee) === callId) busy.delete(call.callee);
  void persistCallLog(call, status, io);
}

/**
 * 1:1 WebRTC call signaling. The server only relays SDP/ICE between the two
 * users and tracks busy/active state — media is peer-to-peer (or via TURN).
 * Register once per connected socket.
 *
 * Client -> server: call:invite, call:accept, call:reject, call:cancel,
 *                   call:end, call:ice
 * Server -> client: call:incoming, call:accepted, call:rejected, call:canceled,
 *                   call:ended, call:ice, call:busy, call:unavailable,
 *                   call:no-answer
 */
export function registerCallHandlers(io: Server, socket: Socket) {
  const me = socket.data.userId as string;

  const isOnline = (userId: string) =>
    (io.sockets.adapter.rooms.get(`user:${userId}`)?.size ?? 0) > 0;

  // Where to reach the other side of a call: the pinned socket when known,
  // otherwise every socket of that user (callee still ringing).
  const target = (call: ActiveCall, userId: string) =>
    userId === call.caller
      ? call.callerSocket
      : call.calleeSocket ?? `user:${call.callee}`;

  // Is this socket the one taking part in the call for its user?
  const isParticipantSocket = (call: ActiveCall) =>
    (call.caller === me && call.callerSocket === socket.id) ||
    (call.callee === me && (!call.calleeSocket || call.calleeSocket === socket.id));

  socket.on("call:invite", async (p: any) => {
    const { callId, toUserId, conversationId, callType, sdp } = p ?? {};
    if (typeof callId !== "string" || typeof toUserId !== "string" || !sdp) return;
    if (callType !== "audio" && callType !== "video") return;
    if (toUserId === me || activeCalls.has(callId)) return;
    if (busy.has(me) || busy.has(toUserId)) {
      socket.emit("call:busy", { callId });
      return;
    }
    if (!isOnline(toUserId)) {
      socket.emit("call:unavailable", { callId });
      return;
    }

    const call: ActiveCall = {
      caller: me,
      callee: toUserId,
      type: callType,
      callerSocket: socket.id,
      delivered: false,
      pendingIce: [],
    };
    activeCalls.set(callId, call);
    busy.set(me, callId);
    busy.set(toUserId, callId);

    call.ringTimer = setTimeout(() => {
      const c = activeCalls.get(callId);
      if (!c || c.acceptedAt) return;
      io.to(c.callerSocket).emit("call:no-answer", { callId });
      io.to(`user:${c.callee}`).emit("call:canceled", { callId });
      teardown(callId, "missed", io);
    }, RING_TIMEOUT_MS);

    let from: { id: string; username: string | null; display_name: string | null; avatar_url: string | null } | null = null;
    try {
      from = await prisma.user.findUnique({
        where: { id: me },
        select: { id: true, username: true, display_name: true, avatar_url: true },
      });
    } catch (err) {
      logger.warn({ err }, "call invite: caller lookup failed");
    }
    // The caller may have hung up while we were looking them up.
    if (activeCalls.get(callId) !== call) return;

    io.to(`user:${toUserId}`).emit("call:incoming", {
      callId,
      conversationId,
      callType,
      sdp,
      from: from ?? { id: me, username: null, display_name: null, avatar_url: null },
    });
    call.delivered = true;
    for (const candidate of call.pendingIce) {
      io.to(`user:${toUserId}`).emit("call:ice", { callId, candidate });
    }
    call.pendingIce = [];
  });

  socket.on("call:accept", (p: any) => {
    const { callId, sdp } = p ?? {};
    const call = activeCalls.get(callId);
    if (!call || call.callee !== me || call.acceptedAt || !sdp) return;
    call.acceptedAt = Date.now();
    call.calleeSocket = socket.id;
    if (call.ringTimer) clearTimeout(call.ringTimer);
    io.to(call.callerSocket).emit("call:accepted", { callId, sdp });
    // Stop the callee's other tabs from ringing.
    socket.to(`user:${me}`).emit("call:canceled", { callId, answeredElsewhere: true });
  });

  socket.on("call:ice", (p: any) => {
    const { callId, candidate } = p ?? {};
    const call = activeCalls.get(callId);
    if (!call || !candidate || !isParticipantSocket(call)) return;
    if (call.caller === me) {
      if (!call.delivered) call.pendingIce.push(candidate);
      else io.to(target(call, call.callee)).emit("call:ice", { callId, candidate });
    } else {
      io.to(target(call, call.caller)).emit("call:ice", { callId, candidate });
    }
  });

  socket.on("call:reject", (p: any) => {
    const call = activeCalls.get(p?.callId);
    if (!call || call.callee !== me || call.acceptedAt) return;
    io.to(call.callerSocket).emit("call:rejected", { callId: p.callId });
    socket.to(`user:${me}`).emit("call:canceled", { callId: p.callId, answeredElsewhere: true });
    teardown(p.callId, "declined", io);
  });

  socket.on("call:cancel", (p: any) => {
    const call = activeCalls.get(p?.callId);
    if (!call || call.caller !== me || call.callerSocket !== socket.id) return;
    io.to(target(call, call.callee)).emit("call:canceled", { callId: p.callId });
    teardown(p.callId, call.acceptedAt ? "ended" : "missed", io);
  });

  socket.on("call:end", (p: any) => {
    const call = activeCalls.get(p?.callId);
    if (!call || !isParticipantSocket(call)) return;
    const other = call.caller === me ? call.callee : call.caller;
    io.to(target(call, other)).emit("call:ended", { callId: p.callId });
    teardown(p.callId, call.acceptedAt ? "ended" : "missed", io);
  });

  socket.on("disconnect", () => {
    for (const [callId, call] of activeCalls) {
      if (call.callerSocket === socket.id) {
        io.to(target(call, call.callee)).emit("call:ended", { callId });
        teardown(callId, call.acceptedAt ? "ended" : "missed", io);
      } else if (call.calleeSocket === socket.id) {
        io.to(call.callerSocket).emit("call:ended", { callId });
        teardown(callId, "ended", io);
      } else if (call.callee === me && !call.acceptedAt && !isOnline(me)) {
        // The callee's last tab went away while it was still ringing.
        io.to(call.callerSocket).emit("call:unavailable", { callId });
        teardown(callId, "missed", io);
      }
    }
  });
}
