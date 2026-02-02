import type { Socket } from "socket.io";
import { verifyAccessToken } from "../../util/jwt";

export type SocketUser = {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string | null;
  role?: string;
  permissions?: string[];
};

declare module "socket.io" {
  interface SocketData {
    user?: SocketUser;
  }
}

const readTokenFromHandshake = (socket: Socket): string | null => {
  const authToken = (socket.handshake.auth as any)?.token as string | undefined;
  if (authToken) return authToken;

  const header = socket.handshake.headers.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }

  const queryToken = (socket.handshake.query as any)?.token;
  if (typeof queryToken === "string" && queryToken.length > 0) return queryToken;

  return null;
};

export const authSocketMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = readTokenFromHandshake(socket);
    if (!token) return next(new Error("UNAUTHORIZED"));

    const decoded = verifyAccessToken(token) as any;
    if (!decoded?.id) return next(new Error("UNAUTHORIZED"));

    socket.data.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      avatar_url: decoded.avatar_url ?? null,
      role: decoded.role,
      permissions: decoded.permissions ?? [],
    };

    return next();
  } catch {
    return next(new Error("UNAUTHORIZED"));
  }
};
