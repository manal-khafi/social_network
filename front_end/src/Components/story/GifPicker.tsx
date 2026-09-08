import { useEffect, useState } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { searchGifs, type GifResult } from "../../api/storiesApi";

interface Props {
  onPick: (gif: GifResult) => void;
  onClose: () => void;
}

export default function GifPicker({ onPick, onClose }: Props) {
  const [q, setQ] = useState("");
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    const term = q.trim() || "trending";
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { configured: cfg, gifs: g } = await searchGifs(term);
        setConfigured(cfg);
        setGifs(g);
      } catch {
        setGifs([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="absolute inset-0 z-40 bg-black/95 flex flex-col text-white">
      <div className="flex items-center gap-2 p-3 border-b border-white/10">
        <button onClick={onClose} aria-label="Close"><X className="w-6 h-6" /></button>
        <span className="font-semibold">GIF</span>
      </div>

      {!configured ? (
        <div className="flex-1 grid place-items-center p-6 text-center text-sm text-white/60">
          GIF search isn’t configured. Set <code className="text-white">GIPHY_API_KEY</code> in the
          backend environment to enable it.
        </div>
      ) : (
        <>
          <div className="p-3">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
              <Search className="w-4 h-4 text-white/50" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search GIPHY"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/40"
              />
              {loading && <Loader2 className="w-4 h-4 animate-spin text-white/50" />}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 grid grid-cols-3 gap-2 content-start">
            {gifs.map((g) => (
              <button
                key={g.id}
                onClick={() => onPick(g)}
                className="rounded-lg overflow-hidden bg-white/5 aspect-square"
              >
                <img
                  src={g.preview_url ?? g.url}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            {!loading && gifs.length === 0 && (
              <p className="col-span-3 text-center text-sm text-white/50 py-8">No GIFs</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
