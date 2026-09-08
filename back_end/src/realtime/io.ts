import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { verifyAccessToken } from "../util/jwt";

let io: Server | null = null;

/**
 * Attach a Socket.IO server to the HTTP server. Each socket authenticates with
 * the same JWT access token used by the REST API and joins a per-user room
 * (`user:<id>`) so the app can push events to a specific person.
 */
export function initRealtime(httpServer: HttpServer, allowedOrigins: string[]) {
  io = new Server(httpServer, {
    path: "/socket.io",
    cors: { origin: allowedOrigins, credentials: true },
    // Trust the proxy's forwarded headers for the client IP.
    transports: ["websocket", "polling"],
  });

  io.use((socket, next) => {
    try {
      const raw =
        (socket.handshake.auth && (socket.handshake.auth as any).token) ||
        (socket.handshake.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (!raw) return next(new Error("unauthorized"));
      const decoded = verifyAccessToken(raw) as { id: string };
      if (!decoded?.id) return next(new Error("unauthorized"));
      (socket.data as any).userId = decoded.id;
      return next();
    } catch {
      return next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    socket.emit("realtime:ready", { userId });
  });

  console.log("Realtime (Socket.IO) initialised on /socket.io");
  return io;
}

/** Push an event to every live socket of a single user. */
export function emitToUser(userId: string, event: string, payload: unknown) {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
}

/** Push an event to several users at once. */
export function emitToUsers(userIds: Iterable<string>, event: string, payload: unknown) {
  if (!io) return;
  const seen = new Set<string>();
  for (const id of userIds) {
    if (id && !seen.has(id)) {
      seen.add(id);
      io.to(`user:${id}`).emit(event, payload);
    }
  }
}

export function getIO() {
  return io;
}
