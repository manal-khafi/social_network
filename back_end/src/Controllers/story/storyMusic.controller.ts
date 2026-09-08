import type { Request, Response } from "express";
import { MusicService } from "../../services/musicService";

export class StoryMusicController {
  /** GET /stories/music/search?q=... */
  static async search(req: Request, res: Response) {
    const q = (req.query.q as string) || "";
    const limit = Math.min(Number(req.query.limit) || 24, 40);
    const tracks = await MusicService.search(q, limit);
    return res.status(200).json({ success: true, data: tracks });
  }
}
