import axios from "axios";
import { AppError } from "../util/error";

export interface GifResult {
  id: string;
  url: string; // animated, story-sized
  preview_url: string | null; // still frame
  width: number;
  height: number;
}

const cache = new Map<string, { at: number; data: GifResult[] }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export class GiphyService {
  static isConfigured() {
    return !!process.env.GIPHY_API_KEY;
  }

  static async search(query: string, limit = 24): Promise<GifResult[]> {
    const key = process.env.GIPHY_API_KEY;
    if (!key) {
      throw new AppError("GIF search is not configured (GIPHY_API_KEY)", 503);
    }
    const term = query.trim();
    if (term.length < 1) return [];

    const cacheKey = `${term.toLowerCase()}:${limit}`;
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

    let data: any;
    try {
      ({ data } = await axios.get("https://api.giphy.com/v1/gifs/search", {
        params: { api_key: key, q: term, limit: Math.min(limit, 40), rating: "pg-13", bundle: "messaging_non_clips" },
        timeout: 6000,
      }));
    } catch {
      throw new AppError("GIF service unavailable, please try again", 503);
    }

    const results: GifResult[] = (data?.data ?? [])
      .map((g: any) => {
        const images = g.images ?? {};
        const animated =
          images.downsized_medium?.url ||
          images.downsized?.url ||
          images.fixed_width?.url ||
          images.original?.url;
        if (!animated) return null;
        return {
          id: String(g.id),
          url: animated,
          preview_url: images.fixed_width_still?.url || images.original_still?.url || null,
          width: Number(images.downsized?.width || images.fixed_width?.width || 0),
          height: Number(images.downsized?.height || images.fixed_width?.height || 0),
        } as GifResult;
      })
      .filter(Boolean);

    cache.set(cacheKey, { at: Date.now(), data: results });
    return results;
  }
}
