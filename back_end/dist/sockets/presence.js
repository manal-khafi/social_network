"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPresenceHandlers = exports.emitPresence = exports.getIsOnline = void 0;
const connectionsByUser = new Map();
const getIsOnline = (userId) => {
    return (connectionsByUser.get(userId)?.size ?? 0) > 0;
};
exports.getIsOnline = getIsOnline;
const getRoomForUserPresence = (userId) => `presence:${userId}`;
const emitPresence = (io, userId) => {
    io.to(getRoomForUserPresence(userId)).emit("presence:update", {
        userId,
        online: (0, exports.getIsOnline)(userId),
    });
};
exports.emitPresence = emitPresence;
const registerPresenceHandlers = (io, socket) => {
    const userId = socket.data.user?.id;
    if (!userId)
        return;
    const previousOnline = (0, exports.getIsOnline)(userId);
    const set = connectionsByUser.get(userId) ?? new Set();
    set.add(socket.id);
    connectionsByUser.set(userId, set);
    if (!previousOnline)
        (0, exports.emitPresence)(io, userId);
    socket.on("presence:subscribe", (payload) => {
        const ids = Array.isArray(payload?.userIds) ? payload.userIds : [];
        for (const id of ids) {
            if (typeof id !== "string" || id.length === 0)
                continue;
            socket.join(getRoomForUserPresence(id));
            socket.emit("presence:update", { userId: id, online: (0, exports.getIsOnline)(id) });
        }
    });
    socket.on("disconnect", () => {
        const wasOnline = (0, exports.getIsOnline)(userId);
        const current = connectionsByUser.get(userId);
        if (current) {
            current.delete(socket.id);
            if (current.size === 0)
                connectionsByUser.delete(userId);
        }
        const isOnlineNow = (0, exports.getIsOnline)(userId);
        if (wasOnline && !isOnlineNow)
            (0, exports.emitPresence)(io, userId);
    });
};
exports.registerPresenceHandlers = registerPresenceHandlers;
