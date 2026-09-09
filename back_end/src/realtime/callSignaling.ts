import type { Server, Socket } from "socket.io";
import prisma from "../util/prisma";
import { logger } from "../util/logger";
import { getOrCreateDirectConversation } from "../util/conversation";

type CallStatus = "ended" | "missed" | "declined";

interface ActiveCall {
  caller: string;
  callee: string;
  type: "audio" | "video";
  acceptedAt?: number;
}

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
  activeCalls.delete(callId);
  busy.delete(call.caller);
  busy.delete(call.callee);
  void persistCallLog(call, status, io);
}

/**
 * 1:1 WebRTC call signaling. The server only relays SDP/ICE between the two
 * users' rooms and tracks busy/active state — media is peer-to-peer (or via
 * TURN). Register once per connected socket.
 */
export function registerCallHandlers(io: Server, socket: Socket) {
  const me = socket.data.userId as string;

  const relay = (toUserId: string, event: string, payload: unknown) =>
    io.to(`user:${toUserId}`).emit(event, payload);

  const isOnline = (userId: string) =>
    (io.sockets.adapter.rooms.get(`user:${userId}`)?.size ?? 0) > 0;

  socket.on("call:invite", async (p: any) => {
    const { callId, toUserId, conversationId, callType, sdp } = p ?? {};
    if (!callId || !toUserId || (callType !== "audio" && callType !== "video")) return;
    if (busy.has(me) || busy.has(toUserId)) {
      socket.emit("call:busy", { callId });
      return;
    }
    if (!isOnline(toUserId)) {
      socket.emit("call:unavailable", { callId });
      return;
    }
    activeCalls.set(callId, { caller: me, callee: toUserId, type: callType });
    busy.set(me, callId);
    busy.set(toUserId, callId);

    const from = await prisma.user.findUnique({
      where: { id: me },
      select: { id: true, username: true, display_name: true, avatar_url: true },
    });
    relay(toUserId, "call:incoming", { callId, conversationId, callType, sdp, from });
  });

  socket.on("call:accept", (p: any) => {
    const { callId, sdp } = p ?? {};
    const call = activeCalls.get(callId);
    if (!call || call.callee !== me) return;
    call.acceptedAt = Date.now();
    relay(call.caller, "call:accepted", { callId, sdp });
  });

  socket.on("call:ice", (p: any) => {
    const { callId, candidate } = p ?? {};
    const call = activeCalls.get(callId);
    if (!call || (call.caller !== me && call.callee !== me)) return;
    const other = call.caller === me ? call.callee : call.caller;
    relay(other, "call:ice", { callId, candidate });
  });

  socket.on("call:reject", (p: any) => {
    const call = activeCalls.get(p?.callId);
    if (!call || call.callee !== me) return;
    relay(call.caller, "call:rejected", { callId: p.callId });
    teardown(p.callId, "declined", io);
  });

  socket.on("call:cancel", (p: any) => {
    const call = activeCalls.get(p?.callId);
    if (!call || call.caller !== me) return;
    relay(call.callee, "call:canceled", { callId: p.callId });
    teardown(p.callId, "missed", io);
  });

  socket.on("call:end", (p: any) => {
    const call = activeCalls.get(p?.callId);
    if (!call || (call.caller !== me && call.callee !== me)) return;
    const other = call.caller === me ? call.callee : call.caller;
    relay(other, "call:ended", { callId: p.callId });
    teardown(p.callId, call.acceptedAt ? "ended" : "missed", io);
  });

  socket.on("disconnect", () => {
    for (const [callId, call] of activeCalls) {
      if (call.caller === me || call.callee === me) {
        const other = call.caller === me ? call.callee : call.caller;
        relay(other, "call:ended", { callId });
        teardown(callId, call.acceptedAt ? "ended" : "missed", io);
      }
    }
  });
}
