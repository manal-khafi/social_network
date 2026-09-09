import type { Request, Response } from "express";

/**
 * ICE servers for WebRTC. Always returns free public STUN; adds a TURN relay
 * only when TURN_URL is configured (see .env.example). Keeps TURN credentials
 * out of the frontend bundle.
 */
export const getIceServers = (_req: Request, res: Response) => {
  const iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }> = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ];

  if (process.env.TURN_URL) {
    iceServers.push({
      urls: process.env.TURN_URL.split(",").map((u) => u.trim()),
      username: process.env.TURN_USER,
      credential: process.env.TURN_PASS,
    });
  }

  return res.json({ iceServers, hasTurn: !!process.env.TURN_URL });
};
