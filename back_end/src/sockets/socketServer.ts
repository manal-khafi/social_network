import { createServer, type Server as HttpServer } from "http";
import type { Express } from "express";
import { Server } from "socket.io";
import { authSocketMiddleware } from "./middleware/authSocket";
import { registerPresenceHandlers } from "./presence";
import { registerInboxSocket } from "./inboxSocket";
import { registerCallSocket } from "./callSocket";
import { registerNotificationSocket } from "./notificationSocket";
import { setSocketServer } from "./ioContext";

export const createHttpServer = (app: Express): HttpServer => createServer(app);

export const initSocketServer = (httpServer: HttpServer, allowedOrigins: string[]) => {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.use(authSocketMiddleware);

  // Allow HTTP controllers/services to emit realtime events.
  setSocketServer(io);

  io.on("connection", (socket) => {
    registerPresenceHandlers(io, socket);
    registerInboxSocket(io, socket);
    registerCallSocket(io, socket);
    registerNotificationSocket(io, socket);

    socket.emit("socket:ready", { userId: socket.data.user?.id });
  });

  return io;
};
