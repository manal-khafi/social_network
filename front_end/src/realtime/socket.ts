import { io, type Socket } from "socket.io-client";
import { store } from "../store";

let socket: Socket | null = null;

/**
 * Lazily-created Socket.IO client. The auth token is read fresh from the Redux
 * store on every (re)connect, so it picks up refreshed access tokens.
 */
export function getSocket(): Socket {
  if (socket) return socket;

  const url = import.meta.env.VITE_SOCKET_URL || window.location.origin;

  socket = io(url, {
    path: "/socket.io",
    autoConnect: false,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    auth: (cb) => cb({ token: store.getState().auth.token || "" }),
  });

  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
}

export function disconnectSocket() {
  socket?.disconnect();
}
