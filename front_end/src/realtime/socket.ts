import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let currentToken: string | null = null;

const resolveSocketURL = () => {
  const rawBaseURL = import.meta.env.VITE_API_URL ?? "";
  if (!rawBaseURL) {
    // If no ENV var is set, assume we are behind a proxy serving both frontend and backend on the same origin
    return typeof window !== "undefined" ? window.location.origin : "";
  }
  // If env var is set (e.g. http://localhost:3500/api), strip /api to get the root
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
