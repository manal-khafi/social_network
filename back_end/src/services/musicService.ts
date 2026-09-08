import axios from "axios";
import { AppError } from "../util/error";

export interface MusicTrack {
  track_id: string;
  title: string;
  artist: string;
  album: string | null;
  cover_url: string | null;
  preview_url: string;
  duration_sec: number | null;
}

// Small in-memory cache so repeated searches (and the story feed hydrating the
// same track) don't hammer the upstream APIs.
const cache = new Map<string, { at: number; data: MusicTrack[] }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

const bumpArtwork = (url: string | undefined | null): string | null => {
  if (!url) return null;
  // iTunes returns 100x100; ask for something crisp on a 9:16 canvas.
  return url.replace(/\/\d+x\d+bb\.(jpg|png)/, "/600x600bb.$1");
};

async function searchItunes(term: string, limit: number): Promise<MusicTrack[]> {
  const { data } = await axios.get("https://itunes.apple.com/search", {
    params: { term, entity: "song", media: "music", limit },
    timeout: 6000,
  });

  return (data?.results ?? [])
    .filter((r: any) => r.previewUrl)
    .map((r: any) => ({
      track_id: `itunes:${r.trackId}`,
      title: r.trackName,
      artist: r.artistName,
      album: r.collectionName ?? null,
      cover_url: bumpArtwork(r.artworkUrl100),
      preview_url: r.previewUrl,
      duration_sec: r.trackTimeMillis ? Math.round(r.trackTimeMillis / 1000) : null,
    }));
}

async function searchDeezer(term: string, limit: number): Promise<MusicTrack[]> {
  const { data } = await axios.get("https://api.deezer.com/search", {
    params: { q: term, limit },
    timeout: 6000,
  });

  return (data?.data ?? [])
    .filter((r: any) => r.preview)
    .map((r: any) => ({
      track_id: `deezer:${r.id}`,
      title: r.title,
      artist: r.artist?.name ?? "Unknown",
      album: r.album?.title ?? null,
      cover_url: r.album?.cover_big ?? r.album?.cover_medium ?? null,
      preview_url: r.preview,
      duration_sec: r.duration ?? null,
    }));
}

export class MusicService {
  static async search(query: string, limit = 24): Promise<MusicTrack[]> {
    const term = query.trim();
    if (term.length < 2) {
      throw new AppError("La recherche doit contenir au moins 2 caractères", 400);
    }

    const key = `${term.toLowerCase()}:${limit}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

    let results: MusicTrack[] = [];
    try {
      results = await searchItunes(term, limit);
    } catch {
      // fall through to Deezer
    }

    if (results.length === 0) {
      try {
        results = await searchDeezer(term, limit);
      } catch {
        throw new AppError("Service de musique indisponible, réessayez", 503);
      }
    }

    cache.set(key, { at: Date.now(), data: results });
    return results;
  }

  /**
   * Authoritative lookup of a single track by its `provider:id` id. Used to
   * re-derive the preview/cover server-side instead of trusting the client.
   */
  static async getTrack(trackId: string): Promise<MusicTrack | null> {
    const [provider, rawId] = String(trackId).split(":");
    if (!rawId) return null;

    const cacheKey = `track:${trackId}`;
    const hit = trackCache.get(cacheKey);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

    let track: MusicTrack | null = null;
    try {
      if (provider === "itunes") {
        const { data } = await axios.get("https://itunes.apple.com/lookup", {
          params: { id: rawId },
          timeout: 6000,
        });
        const r = (data?.results ?? []).find((x: any) => x.previewUrl);
        if (r) {
          track = {
            track_id: `itunes:${r.trackId}`,
            title: r.trackName,
            artist: r.artistName,
            album: r.collectionName ?? null,
            cover_url: bumpArtwork(r.artworkUrl100),
            preview_url: r.previewUrl,
            duration_sec: r.trackTimeMillis ? Math.round(r.trackTimeMillis / 1000) : null,
          };
        }
      } else if (provider === "deezer") {
        const { data } = await axios.get(`https://api.deezer.com/track/${encodeURIComponent(rawId)}`, {
          timeout: 6000,
        });
        if (data?.preview) {
          track = {
            track_id: `deezer:${data.id}`,
            title: data.title,
            artist: data.artist?.name ?? "Unknown",
            album: data.album?.title ?? null,
            cover_url: data.album?.cover_big ?? data.album?.cover_medium ?? null,
            preview_url: data.preview,
            duration_sec: data.duration ?? null,
          };
        }
      }
    } catch {
      return null;
    }

    if (track) trackCache.set(cacheKey, { at: Date.now(), data: track });
    return track;
  }
}

const trackCache = new Map<string, { at: number; data: MusicTrack }>();
