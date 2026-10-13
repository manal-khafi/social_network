import { useEffect, useRef, useState } from "react";
import { Search, Play, Pause, Loader2, Music2, X } from "lucide-react";
import { searchMusic, type MusicTrack } from "../../api/storiesApi";
import { useTranslation } from "react-i18next";

export interface SelectedMusic extends MusicTrack {
  start_sec: number;
}

interface Props {
  value: SelectedMusic | null;
  onChange: (music: SelectedMusic | null) => void;
  onClose: () => void;
}

const CLIP_LENGTH = 15; // seconds shown on a story

export default function MusicPicker({ value, onChange, onClose }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        setResults(await searchMusic(term));
      } catch {
        setError(t("stories.musicSearchFailedTryAgain"));
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const togglePreview = (track: MusicTrack, fromSec = 0) => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;

    if (previewingId === track.track_id) {
      audio.pause();
      setPreviewingId(null);
      return;
    }
    audio.src = track.preview_url;
    audio.currentTime = fromSec;
    audio.play().then(
      () => setPreviewingId(track.track_id),
      () => setError(t("stories.previewUnavailable"))
    );
    audio.onended = () => setPreviewingId(null);
  };

  const pick = (track: MusicTrack) => {
    onChange({ ...track, start_sec: 0 });
  };

  const maxStart = value
    ? Math.max(0, (value.duration_sec ?? 30) - CLIP_LENGTH)
    : 0;

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-black/95 text-white">
      <div className="flex items-center gap-2 p-3 border-b border-white/10">
        <button onClick={onClose} className="p-1"><X className="w-6 h-6" /></button>
        <span className="font-semibold">{t("stories.music")}</span>
      </div>

      {value ? (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {value.cover_url ? (
              <img src={value.cover_url} alt="" className="w-14 h-14 rounded object-cover" />
            ) : (
              <div className="w-14 h-14 rounded bg-white/10 grid place-items-center">
                <Music2 className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{value.title}</p>
              <p className="text-sm text-white/60 truncate">{value.artist}</p>
            </div>
            <button
              onClick={() => togglePreview(value, value.start_sec)}
              className="p-2 rounded-full bg-white/10"
            >
              {previewingId === value.track_id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>

          <div className="mt-4">
            <label className="text-xs text-white/60">
              Start at {value.start_sec}s · plays {CLIP_LENGTH}s
            </label>
            <input
              type="range"
              min={0}
              max={maxStart}
              step={1}
              value={value.start_sec}
              onChange={(e) => onChange({ ...value, start_sec: Number(e.target.value) })}
              className="w-full accent-white"
            />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onChange(null)}
              className="flex-1 py-2 rounded-lg bg-white/10 text-sm"
            >
              {t("actions.remove")}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-white text-black font-semibold text-sm"
            >
              {t("actions.done")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="p-3">
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
          <Search className="w-4 h-4 text-white/60" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("stories.searchSongsArtists")}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/50"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-white/60" />}
        </div>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-6">
        {results.map((track) => (
          <div
            key={track.track_id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
          >
            <button
              onClick={() => togglePreview(track)}
              className="relative w-12 h-12 rounded overflow-hidden bg-white/10 shrink-0 grid place-items-center"
            >
              {track.cover_url && (
                <img src={track.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <span className="relative z-10 bg-black/40 rounded-full p-1">
                {previewingId === track.track_id ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </span>
            </button>
            <button onClick={() => pick(track)} className="min-w-0 flex-1 text-start">
              <p className="text-sm font-medium truncate">{track.title}</p>
              <p className="text-xs text-white/55 truncate">{track.artist}</p>
            </button>
          </div>
        ))}
        {!loading && query.trim().length >= 2 && results.length === 0 && !error && (
          <p className="text-center text-sm text-white/50 mt-8">{t("stories.noResults")}</p>
        )}
      </div>
    </div>
  );
}
