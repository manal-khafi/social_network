import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, Trash2, Pencil, MoreHorizontal, Music2 } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "../../hooks";
import { Avatar, AvatarFallback, AvatarImage } from "../../Components/ui/avatar";
import StoryOverlayLayer from "../../Components/story/StoryOverlayLayer";
import {
  getHighlight,
  removeFromHighlight,
  deleteHighlight,
  renameHighlight,
  type Highlight,
} from "../../api/highlightsApi";
import { IMAGE_STORY_MS } from "../../Components/story/storyConfig";

export default function HighlightViewerView() {
  const { highlightId } = useParams();
  const navigate = useNavigate();
  const currentUser = useAppSelector((s) => s.user.currentUser);

  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameValue, setRenameValue] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const items = highlight?.items ?? [];
  const item = items[idx];
  const isOwner = highlight?.user.id === currentUser?.id;

  useEffect(() => {
    if (!highlightId) return;
    getHighlight(highlightId)
      .then((h) => {
        setHighlight(h);
        if (h.items.length === 0) {
          toast("This highlight is empty");
          navigate(-1);
        }
      })
      .catch(() => {
        toast.error("Highlight not found");
        navigate(-1);
      });
  }, [highlightId, navigate]);

  const next = () => {
    if (idx < items.length - 1) {
      setIdx((i) => i + 1);
      setProgress(0);
    } else navigate(-1);
  };
  const prev = () => {
    if (idx > 0) {
      setIdx((i) => i - 1);
      setProgress(0);
    }
  };

  // segment timer (images/text)
  useEffect(() => {
    if (!item || paused || menuOpen) return;
    if (item.content_type === "video") return;
    const start = Date.now();
    const t = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / IMAGE_STORY_MS);
      setProgress(p);
      if (p >= 1) {
        window.clearInterval(t);
        next();
      }
    }, 40);
    return () => window.clearInterval(t);
  }, [item?.id, paused, menuOpen]);

  // music
  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    const preview = item?.music?.preview_url;
    if (!preview) {
      a.pause();
      return;
    }
    if (a.src !== preview) {
      a.src = preview;
      a.currentTime = item?.music?.start_sec ?? 0;
    }
    a.loop = true;
    if (paused || menuOpen) a.pause();
    else a.play().catch(() => {});
    return () => a.pause();
  }, [item?.id, paused, menuOpen]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "Escape") navigate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const onTap = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.35) prev();
    else if (x > rect.width * 0.65) next();
    else setPaused((p) => !p);
  };

  const doRemoveItem = async () => {
    if (!highlight || !item) return;
    setMenuOpen(false);
    try {
      const res = await removeFromHighlight(highlight.id, item.id);
      toast.success("Removed from highlight");
      if (res.deleted || items.length <= 1) return navigate(-1);
      setHighlight({ ...highlight, items: items.filter((s) => s.id !== item.id) });
      setIdx((i) => Math.max(0, i - 1));
    } catch {
      toast.error("Could not remove");
    }
  };

  const doDelete = async () => {
    if (!highlight || !window.confirm(`Delete highlight “${highlight.title}”?`)) return;
    try {
      await deleteHighlight(highlight.id);
      toast.success("Highlight deleted");
      navigate(-1);
    } catch {
      toast.error("Could not delete");
    }
  };

  const startRename = () => {
    if (!highlight) return;
    setMenuOpen(false);
    setPaused(true);
    setRenameValue(highlight.title);
  };

  const commitRename = async () => {
    if (!highlight || renameValue === null) return;
    const title = renameValue.trim();
    setRenameValue(null);
    setPaused(false);
    if (!title || title === highlight.title) return;
    try {
      await renameHighlight(highlight.id, title);
      setHighlight({ ...highlight, title });
      toast.success("Renamed");
    } catch {
      toast.error("Could not rename");
    }
  };

  if (!highlight || !item) return <div className="fixed inset-0 bg-black z-50" />;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-[440px] mx-auto">
        <div className="absolute top-2 left-3 right-3 flex gap-1 z-30">
          {items.map((s, i) => (
            <div key={s.id} className="flex-1 h-[3px] bg-white/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-white"
                style={{
                  width: i < idx ? "100%" : i === idx ? `${progress * 100}%` : "0%",
                  transition: i === idx ? "width 60ms linear" : "none",
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-5 left-3 right-3 flex items-center justify-between z-30 pt-1">
          <div className="flex items-center gap-2">
            <Avatar className="w-9 h-9 border border-white/60">
              <AvatarImage src={highlight.user.avatar_url ?? undefined} />
              <AvatarFallback>{highlight.user.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-white leading-tight">
              <p className="text-sm font-semibold">{highlight.title}</p>
              <p className="text-[11px] opacity-80">@{highlight.user.username}</p>
            </div>
            {item.music && (
              <div className="flex items-center gap-1 bg-white/15 rounded-full pl-1 pr-2 py-0.5 ml-1">
                <Music2 className="w-3 h-3 text-white" />
                <span className="text-[10px] text-white max-w-[110px] truncate">
                  {item.music.title} · {item.music.artist}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => { setMenuOpen((o) => !o); setPaused(true); }}
                  aria-label="Highlight options"
                  className="p-2 rounded-full bg-black/40 text-white"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-44 rounded-xl bg-neutral-900 border border-white/10 overflow-hidden text-sm">
                    <button onClick={startRename} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10">
                      <Pencil className="w-4 h-4" /> Rename
                    </button>
                    <button onClick={doRemoveItem} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10">
                      <Trash2 className="w-4 h-4" /> Remove this story
                    </button>
                    <button onClick={doDelete} className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-white/10">
                      <Trash2 className="w-4 h-4" /> Delete highlight
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => navigate(-1)}
              aria-label="Close"
              className="p-2 rounded-full bg-black/40 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          className="absolute inset-0"
          onClick={onTap}
          style={
            item.content_type === "text"
              ? { background: item.bg_color ?? "#111827" }
              : undefined
          }
        >
          {item.content_type === "image" && (
            <img
              src={item.content_url}
              alt={item.caption || `${highlight.title} highlight`}
              className="w-full h-full object-contain"
            />
          )}
          {item.content_type === "video" && (
            <video
              ref={videoRef}
              src={item.content_url}
              poster={item.thumbnail_url ?? undefined}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              muted
              onTimeUpdate={() => {
                const v = videoRef.current;
                if (!v || !v.duration) return;
                const p = Math.min(1, v.currentTime / Math.min(v.duration, 60));
                setProgress(p);
                if (p >= 1) next();
              }}
            />
          )}

          <StoryOverlayLayer overlays={item.overlays ?? []} />

          {item.content_type === "text" && !(item.overlays ?? []).length && item.caption && (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <p className="text-white text-2xl font-extrabold text-center drop-shadow whitespace-pre-wrap">
                {item.caption}
              </p>
            </div>
          )}
        </div>

        {item.content_type !== "text" && item.caption && (
          <div className="absolute bottom-6 left-4 right-4 z-20 text-center">
            <span className="inline-block bg-black/45 text-white text-sm px-3 py-1.5 rounded-lg">
              {item.caption}
            </span>
          </div>
        )}

        {renameValue !== null && (
          <div className="absolute inset-0 z-40 bg-black/80 flex flex-col justify-center p-6 text-white">
            <p className="text-sm text-white/70 mb-2">Rename highlight</p>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setRenameValue(null);
                  setPaused(false);
                }
              }}
              maxLength={60}
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-lg font-semibold outline-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setRenameValue(null);
                  setPaused(false);
                }}
                className="flex-1 rounded-full bg-white/10 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={commitRename}
                className="flex-1 rounded-full bg-white text-black py-2.5 text-sm font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
