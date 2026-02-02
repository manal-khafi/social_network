import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let currentToken: string | null = null;

const resolveSocketURL = () => {
  const rawBaseURL = import.meta.env.VITE_API_URL || "http://localhost:3500";
  // backend server is on base (not /api)
  return String(rawBaseURL).replace(/\/+$/, "").replace(/\/api$/, "");
};

export const getSocket = (token: string | null): Socket | null => {
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
      currentToken = null;
    }
    return null;
  }

  if (socket && currentToken === token) return socket;

  // Token changed: force reconnect
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = token;

  socket = io(resolveSocketURL(), {
    // Allow polling fallback in dev environments where WebSocket can fail
    transports: ["polling", "websocket"],
    withCredentials: true,
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
  socket = null;
  currentToken = null;
};
