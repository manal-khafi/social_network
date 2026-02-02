"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocketServer = exports.createHttpServer = void 0;
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const authSocket_1 = require("./middleware/authSocket");
const presence_1 = require("./presence");
const inboxSocket_1 = require("./inboxSocket");
const callSocket_1 = require("./callSocket");
const notificationSocket_1 = require("./notificationSocket");
const ioContext_1 = require("./ioContext");
const createHttpServer = (app) => (0, http_1.createServer)(app);
exports.createHttpServer = createHttpServer;
const initSocketServer = (httpServer, allowedOrigins) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            credentials: true,
            methods: ["GET", "POST"],
        },
    });
    io.use(authSocket_1.authSocketMiddleware);
    // Allow HTTP controllers/services to emit realtime events.
    (0, ioContext_1.setSocketServer)(io);
    io.on("connection", (socket) => {
        (0, presence_1.registerPresenceHandlers)(io, socket);
        (0, inboxSocket_1.registerInboxSocket)(io, socket);
        (0, callSocket_1.registerCallSocket)(io, socket);
        (0, notificationSocket_1.registerNotificationSocket)(io, socket);
        socket.emit("socket:ready", { userId: socket.data.user?.id });
    });
    return io;
};
exports.initSocketServer = initSocketServer;
