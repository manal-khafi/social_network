import type { Request, Response } from "express";
import { GiphyService } from "../../services/giphyService";

export class StoryGifController {
  /** GET /stories/gifs/search?q=... */
  static async search(req: Request, res: Response) {
    const q = (req.query.q as string) || "";
    const limit = Math.min(Number(req.query.limit) || 24, 40);
    const gifs = await GiphyService.search(q, limit);
    return res.status(200).json({ success: true, configured: GiphyService.isConfigured(), data: gifs });
  }
}
