import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCallbackRef } from "../../Components/story/useCallbackRef";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, Heart, Send, Volume2, VolumeX, Music2, Trash2, ChevronLeft, ChevronRight, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "../../hooks";
import {
  fetchStories,
  markStoryViewed,
  setStoryReaction,
  toggleStoryLike,
  replyToStory,
  removeStory,
  selectStoryGroups,
} from "../../features/stories/storiesSlice";
import { getUserStories, type Story, type StoryUser } from "../../api/storiesApi";
import { Avatar, AvatarFallback, AvatarImage } from "../../Components/ui/avatar";
import StoryOverlayLayer from "../../Components/story/StoryOverlayLayer";
import ShareStorySheet from "../../Components/story/ShareStorySheet";
import SeenBySheet from "../../Components/story/SeenBySheet";
import { DEFAULT_REACTIONS } from "../../api/storiesApi";
import { IMAGE_STORY_MS, MAX_VIDEO_STORY_MS } from "../../Components/story/storyConfig";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

export default function StoryViewerView() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { userId } = useParams();
  const groups = useAppSelector(selectStoryGroups);
  const currentUser = useAppSelector((s) => s.user.currentUser);

  const [localGroup, setLocalGroup] = useState<{ user: StoryUser; items: Story[] } | null>(null);
  const [itemIdx, setItemIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSeenBy, setShowSeenBy] = useState(false);
  const [flyHearts, setFlyHearts] = useState<number[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTap = useRef(0);
  const holdTimer = useRef<number | null>(null);

  const groupIdx = groups.findIndex((g) => g.user.id === userId);
  const group = groupIdx >= 0 ? groups[groupIdx] : localGroup;
  const items = group?.items ?? [];
  const story = items[itemIdx];
  const isOwn = story?.user_id === currentUser?.id;
  const anySheetOpen = showShare || showSeenBy || showReactions;

  // Load stories if the feed isn't in redux yet (deep link / refresh).
  useEffect(() => {
    if (groupIdx >= 0) return;
    let cancelled = false;
    getUserStories(userId!)
      .then((data) => {
        if (!cancelled) setLocalGroup(data);
      })
      .catch(() => navigate(-1));
    dispatch(fetchStories());
    return () => {
      cancelled = true;
    };
  }, [userId, groupIdx, dispatch, navigate]);

  // Reset segment index when the group changes.
  useEffect(() => {
    setItemIdx(0);
    setProgress(0);
  }, [userId]);

  const goPrev = useCallbackRef(() => {
    if (itemIdx > 0) {
      setItemIdx((i) => i - 1);
      setProgress(0);
    } else if (groupIdx > 0) {
      navigate(`/home/stories/${groups[groupIdx - 1].user.id}`);
    }
  });

  const goNext = useCallbackRef(() => {
    if (itemIdx < items.length - 1) {
      setItemIdx((i) => i + 1);
      setProgress(0);
    } else if (groupIdx >= 0 && groupIdx < groups.length - 1) {
      navigate(`/home/stories/${groups[groupIdx + 1].user.id}`);
    } else {
      navigate(-1);
    }
  });

  // Mark viewed once per segment.
  useEffect(() => {
    if (story && !story.has_viewed) {
      dispatch(markStoryViewed(story.id));
    }
  }, [story?.id, dispatch]);

  // Segment timer.
  useEffect(() => {
    if (!story) return;
    setProgress(0);
    if (paused || anySheetOpen) return;

    const isVideo = story.content_type === "video";
    if (isVideo) {
      // progress driven by <video> timeupdate below
      return;
    }
    const duration = IMAGE_STORY_MS;
    const start = Date.now();
    const id = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setProgress(p);
      if (p >= 1) {
        window.clearInterval(id);
        goNext();
      }
    }, 40);
    return () => window.clearInterval(id);
  }, [story?.id, paused, anySheetOpen, goNext]);

  // Video playback control.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || story?.content_type !== "video") return;
    v.muted = muted;
    if (paused || anySheetOpen) v.pause();
    else v.play().catch(() => {});
  }, [paused, anySheetOpen, muted, story?.id]);

  // Music playback.
  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    const preview = story?.music?.preview_url;
    if (!preview) {
      audio.pause();
      return;
    }
    if (audio.src !== preview) {
      audio.src = preview;
      audio.currentTime = story?.music?.start_sec ?? 0;
    }
    audio.muted = muted;
    audio.loop = true;
    if (paused || anySheetOpen) audio.pause();
    else audio.play().catch(() => {});
    return () => {
      audio.pause();
    };
  }, [story?.id, story?.music?.preview_url, paused, anySheetOpen, muted]);

  // Pause on tab hide.
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const react = (emoji: string) => {
    if (!story) return;
    dispatch(setStoryReaction({ storyId: story.id, emoji }));
    setShowReactions(false);
    if (emoji === "❤️") {
      const key = Date.now();
      setFlyHearts((h) => [...h, key]);
      setTimeout(() => setFlyHearts((h) => h.filter((k) => k !== key)), 1100);
    }
  };

  const onMediaTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      react("❤️");
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.35) goPrev();
    else if (x > rect.width * 0.65) goNext();
    else setPaused((p) => !p);
  };

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text || !story) return;
    setReplyText("");
    try {
      await dispatch(replyToStory({ storyId: story.id, content: text })).unwrap();
      toast.success("Reply sent");
    } catch {
      toast.error("Could not send reply");
    }
  };

  const del = async () => {
    if (!story) return;
    if (!window.confirm("Delete this story?")) return;
    try {
      await dispatch(removeStory(story.id)).unwrap();
      toast.success("Story deleted");
      if (items.length <= 1) navigate(-1);
      else setItemIdx((i) => Math.max(0, i - 1));
    } catch {
      toast.error("Could not delete story");
    }
  };

  const videoTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const cap = Math.min(v.duration * 1000, MAX_VIDEO_STORY_MS) / 1000;
    const p = Math.min(1, v.currentTime / cap);
    setProgress(p);
    if (p >= 1) goNext();
  };

  const overlays = useMemo(() => story?.overlays ?? [], [story]);

  if (!group || !story) {
    return <div className="fixed inset-0 bg-black z-50" />;
  }

  const isText = story.content_type === "text";

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-[440px] mx-auto">
        {/* progress bars */}
        <div className="absolute top-2 left-3 right-3 flex gap-1 z-30">
          {items.map((s, i) => (
            <div key={s.id} className="flex-1 h-[3px] bg-white/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-white"
                style={{
                  width: i < itemIdx ? "100%" : i === itemIdx ? `${progress * 100}%` : "0%",
                  transition: i === itemIdx ? "width 60ms linear" : "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* header */}
        <div className="absolute top-5 left-3 right-3 flex items-center justify-between z-30 pt-1">
          <div className="flex items-center gap-2">
            <Avatar className="w-9 h-9 border border-white/60">
              <AvatarImage src={group.user.avatar_url ?? undefined} />
              <AvatarFallback>{group.user.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-white leading-tight">
              <p className="text-sm font-semibold">{group.user.username}</p>
              <p className="text-[11px] opacity-80">{timeAgo(story.created_at)}</p>
            </div>
            {story.music && (
              <div className="flex items-center gap-1 bg-white/15 rounded-full pl-1 pr-2 py-0.5 ml-1">
                {story.music.cover_url ? (
                  <img src={story.music.cover_url} className="w-4 h-4 rounded-full" alt="" />
                ) : (
                  <Music2 className="w-3 h-3 text-white" />
                )}
                <span className="text-[10px] text-white max-w-[110px] truncate">
                  {story.music.title} · {story.music.artist}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {(story.music || story.content_type === "video") && (
              <button
                onClick={() => setMuted((m) => !m)}
                className="p-2 rounded-full bg-black/40 text-white"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
            {isOwn && (
              <button onClick={del} className="p-2 rounded-full bg-black/40 text-white">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-black/40 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* media */}
        <div
          className="absolute inset-0"
          onClick={onMediaTap}
          onPointerDown={() => {
            holdTimer.current = window.setTimeout(() => setPaused(true), 220);
          }}
          onPointerUp={() => {
            if (holdTimer.current) window.clearTimeout(holdTimer.current);
            setPaused(false);
          }}
          style={isText ? { background: story.bg_color ?? "#111827" } : undefined}
        >
          {story.content_type === "image" && (
            <img src={story.content_url} alt="" className="w-full h-full object-contain" />
          )}
          {story.content_type === "video" && (
            <video
              ref={videoRef}
              src={story.content_url}
              poster={story.thumbnail_url ?? undefined}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              loop={false}
              onTimeUpdate={videoTimeUpdate}
            />
          )}

          {/* reshared post card */}
          {story.sharedPost && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[82%] rounded-xl bg-white/95 text-black p-3 shadow-xl">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={story.sharedPost.user.avatar_url ?? undefined} />
                  <AvatarFallback>{story.sharedPost.user.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold">@{story.sharedPost.user.username}</span>
              </div>
              {story.sharedPost.content && (
                <p className="text-sm mt-2 line-clamp-5">{story.sharedPost.content}</p>
              )}
            </div>
          )}

          <StoryOverlayLayer overlays={overlays} />

          {isText && !overlays.length && story.caption && (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <p className="text-white text-2xl font-extrabold text-center drop-shadow whitespace-pre-wrap">
                {story.caption}
              </p>
            </div>
          )}
        </div>

        {/* caption (media stories) */}
        {!isText && story.caption && (
          <div className="absolute bottom-24 left-4 right-4 z-20 text-center">
            <span className="inline-block bg-black/45 text-white text-sm px-3 py-1.5 rounded-lg">
              {story.caption}
            </span>
          </div>
        )}

        {/* flying hearts */}
        <AnimatePresence>
          {flyHearts.map((k) => (
            <motion.div
              key={k}
              initial={{ opacity: 0, scale: 0.4, y: 0 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.4, 1, 0.9], y: -160 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1 }}
              className="absolute left-1/2 bottom-28 -translate-x-1/2 z-30"
            >
              <Heart className="w-20 h-20 fill-red-500 text-red-500" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-30">
          {isOwn ? (
            <button
              onClick={() => setShowSeenBy(true)}
              className="w-full flex items-center justify-center gap-2 text-white/90 text-sm py-2"
            >
              <Eye className="w-4 h-4" />
              {story._count.views} views
              {story._count.reactions > 0 && ` · ${story._count.reactions} reactions`}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-black/40 border border-white/25 rounded-full px-3 py-1.5 backdrop-blur">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setPaused(true)}
                  onBlur={() => setPaused(false)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  placeholder={`Reply to ${group.user.username}…`}
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-white/55 outline-none"
                />
                {replyText.trim() && (
                  <button onClick={sendReply}>
                    <Send className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>

              <button
                onClick={() => react("❤️")}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setShowReactions(true);
                }}
                className="p-2"
              >
                <Heart
                  className={`w-7 h-7 ${
                    story.my_reaction === "❤️" ? "fill-red-500 text-red-500" : "text-white"
                  }`}
                />
              </button>
              <button onClick={() => setShowReactions((s) => !s)} className="p-2 text-white text-lg">
                {story.my_reaction && story.my_reaction !== "❤️" ? story.my_reaction : "😊"}
              </button>
              <button onClick={() => setShowShare(true)} className="p-2">
                <Send className="w-7 h-7 text-white -rotate-12" />
              </button>
            </div>
          )}
        </div>

        {/* reaction tray */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 flex gap-2 bg-neutral-900/95 rounded-full px-3 py-2 border border-white/10"
            >
              {DEFAULT_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => react(emoji)}
                  className={`text-2xl transition-transform hover:scale-125 ${
                    story.my_reaction === emoji ? "scale-125" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* side nav (desktop) */}
        <button
          onClick={goPrev}
          className="hidden md:flex absolute left-[-52px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 items-center justify-center text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={goNext}
          className="hidden md:flex absolute right-[-52px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 items-center justify-center text-white"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {showShare && <ShareStorySheet storyId={story.id} onClose={() => setShowShare(false)} />}
        {showSeenBy && (
          <SeenBySheet
            storyId={story.id}
            viewCount={story._count.views}
            onClose={() => setShowSeenBy(false)}
          />
        )}
      </div>
    </div>
  );
}
