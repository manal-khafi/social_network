"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authSocketMiddleware = void 0;
const jwt_1 = require("../../util/jwt");
const readTokenFromHandshake = (socket) => {
    const authToken = socket.handshake.auth?.token;
    if (authToken)
        return authToken;
    const header = socket.handshake.headers.authorization;
    if (typeof header === "string" && header.startsWith("Bearer ")) {
        return header.slice("Bearer ".length);
    }
    const queryToken = socket.handshake.query?.token;
    if (typeof queryToken === "string" && queryToken.length > 0)
        return queryToken;
    return null;
};
const authSocketMiddleware = (socket, next) => {
    try {
        const token = readTokenFromHandshake(socket);
        if (!token)
            return next(new Error("UNAUTHORIZED"));
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        if (!decoded?.id)
            return next(new Error("UNAUTHORIZED"));
        socket.data.user = {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
            avatar_url: decoded.avatar_url ?? null,
            role: decoded.role,
            permissions: decoded.permissions ?? [],
        };
        return next();
    }
    catch {
        return next(new Error("UNAUTHORIZED"));
    }
};
exports.authSocketMiddleware = authSocketMiddleware;
