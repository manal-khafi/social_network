import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, Type, Smile, Music2, ImagePlus, Loader2, Sparkles, Check, ChevronDown, Trash2, Link2, BarChart3,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { createStory } from "../../features/stories/storiesSlice";
import { uploadStoryMedia } from "../../utils/uploadStoryMedia";
import type { StoryOverlay, StoryVisibility, SharedPostRef } from "../../api/storiesApi";
import MusicPicker, { type SelectedMusic } from "./MusicPicker";
import StoryOverlayLayer from "./StoryOverlayLayer";
import {
  TEXT_COLORS, STORY_BACKGROUNDS, FONT_FAMILIES, VISIBILITY_OPTIONS,
} from "./storyConfig";

interface Props {
  open: boolean;
  onClose: () => void;
  sharedPost?: SharedPostRef | null;
}

type Mode = "choose" | "text" | "media";

const uid = () => Math.random().toString(36).slice(2, 10);

export default function StoryComposer({ open, onClose, sharedPost = null }: Props) {
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector((s) => s.user.currentUser?.id);
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>(sharedPost ? "text" : "choose");
  const [media, setMedia] = useState<{
    url: string;
    type: "image" | "video";
    thumbnailUrl?: string;
    durationSec?: number;
  } | null>(null);
  const [bgIndex, setBgIndex] = useState(0);
  const [caption, setCaption] = useState("");
  const [overlays, setOverlays] = useState<StoryOverlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [music, setMusic] = useState<SelectedMusic | null>(null);
  const [visibility, setVisibility] = useState<StoryVisibility>("public");

  const [showMusic, setShowMusic] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showVisibility, setShowVisibility] = useState(false);
  const [textDraft, setTextDraft] = useState<{
    open: boolean;
    value: string;
    color: string;
    font: string;
    bg: boolean;
    editingId: string | null;
  }>({ open: false, value: "", color: "#ffffff", font: FONT_FAMILIES[0].value, bg: false, editingId: null });

  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  // Play the selected track on the editing canvas (Instagram behaviour).
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!previewAudioRef.current) previewAudioRef.current = new Audio();
    const audio = previewAudioRef.current;
    const editing =
      open && (mode === "media" || mode === "text") && !showMusic && !showEmoji && !textDraft.open;
    const preview = music?.preview_url;
    if (!preview || !editing) {
      audio.pause();
      return;
    }
    if (audio.src !== preview) audio.src = preview;
    audio.currentTime = music?.start_sec ?? 0;
    audio.loop = true;
    audio.play().catch(() => {});
    return () => audio.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, showMusic, showEmoji, textDraft.open, music?.preview_url, music?.start_sec]);

  const reset = () => {
    setMode(sharedPost ? "text" : "choose");
    setMedia(null);
    setBgIndex(0);
    setCaption("");
    setOverlays([]);
    setSelectedOverlayId(null);
    setMusic(null);
    setVisibility("public");
    setShowMusic(false);
    setShowEmoji(false);
    setShowVisibility(false);
    setTextDraft({ open: false, value: "", color: "#ffffff", font: FONT_FAMILIES[0].value, bg: false, editingId: null });
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadStoryMedia(file, currentUserId);
      setMedia({
        url: result.url,
        type: result.type,
        thumbnailUrl: result.thumbnailUrl,
        durationSec: result.durationSec,
      });
      setMode("media");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const patchOverlay = (id: string, patch: Partial<StoryOverlay>) =>
    setOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const removeSelectedOverlay = () => {
    if (!selectedOverlayId) return;
    setOverlays((prev) => prev.filter((o) => o.id !== selectedOverlayId));
    setSelectedOverlayId(null);
  };

  const openTextEditor = (existing?: StoryOverlay) => {
    setTextDraft({
      open: true,
      value: existing?.text ?? "",
      color: existing?.color ?? "#ffffff",
      font: existing?.fontFamily ?? FONT_FAMILIES[0].value,
      bg: !!existing?.background,
      editingId: existing?.id ?? null,
    });
  };

  const commitText = () => {
    const value = textDraft.value.trim();
    if (!value) {
      setTextDraft((d) => ({ ...d, open: false }));
      return;
    }
    if (textDraft.editingId) {
      patchOverlay(textDraft.editingId, {
        text: value,
        color: textDraft.color,
        fontFamily: textDraft.font,
        background: textDraft.bg ? "rgba(0,0,0,0.55)" : null,
      });
    } else {
      setOverlays((prev) => [
        ...prev,
        {
          id: uid(),
          type: "text",
          text: value,
          x: 0.5,
          y: 0.45,
          rotation: 0,
          scale: 1,
          color: textDraft.color,
          fontFamily: textDraft.font,
          background: textDraft.bg ? "rgba(0,0,0,0.55)" : null,
        },
      ]);
    }
    setTextDraft((d) => ({ ...d, open: false }));
  };

  const addEmoji = (emoji: string) => {
    setOverlays((prev) => [
      ...prev,
      { id: uid(), type: "emoji", text: emoji, x: 0.5, y: 0.5, rotation: 0, scale: 1 },
    ]);
    setShowEmoji(false);
  };

  const addLink = () => {
    const url = window.prompt("Link URL (https://…)")?.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      toast.error("Link must start with http:// or https://");
      return;
    }
    const label = window.prompt("Label (optional)")?.trim() || undefined;
    setOverlays((prev) => [
      ...prev,
      { id: uid(), type: "link", url, label, x: 0.5, y: 0.72, rotation: 0, scale: 1 },
    ]);
  };

  const addPoll = () => {
    const question = window.prompt("Poll question")?.trim();
    if (!question) return;
    const a = window.prompt("Option 1")?.trim();
    const b = window.prompt("Option 2")?.trim();
    if (!a || !b) {
      toast.error("A poll needs two options");
      return;
    }
    setOverlays((prev) => [
      ...prev,
      { id: uid(), type: "poll", question, options: [a, b], x: 0.5, y: 0.5, rotation: 0, scale: 1 },
    ]);
  };

  const canShare =
    mode === "media"
      ? !!media
      : mode === "text"
      ? caption.trim().length > 0 || overlays.length > 0 || !!sharedPost
      : false;

  const background = STORY_BACKGROUNDS[bgIndex];

  const share = async () => {
    if (!canShare || posting) return;
    setPosting(true);
    try {
      const payload = {
        content_url: mode === "media" ? media!.url : caption.trim() || "text",
        content_type: (mode === "media" ? media!.type : "text") as "image" | "video" | "text",
        visibility,
        caption: caption.trim() || undefined,
        thumbnail_url: media?.thumbnailUrl,
        duration_sec: media?.durationSec,
        bg_color: mode === "text" ? background : undefined,
        overlays,
        music: music
          ? {
              track_id: music.track_id,
              title: music.title,
              artist: music.artist,
              cover_url: music.cover_url ?? undefined,
              preview_url: music.preview_url,
              start_sec: music.start_sec,
            }
          : null,
        shared_post_id: sharedPost?.id,
      };
      await dispatch(createStory(payload)).unwrap();
      toast.success("Story shared");
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not share story");
    } finally {
      setPosting(false);
    }
  };

  const previewStyle = useMemo(
    () =>
      mode === "text"
        ? { background }
        : media?.type === "image"
        ? { backgroundImage: `url(${media.url})`, backgroundSize: "cover", backgroundPosition: "center" }
        : { background: "#000" },
    [mode, media, background]
  );

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col">
      {/* top bar */}
      <div className="flex items-center justify-between p-3">
        <button onClick={close} aria-label="Close"><X className="w-6 h-6" /></button>
        <span className="text-sm font-semibold">Create story</span>
        <div className="w-6" />
      </div>

      {mode === "choose" && (
        <div className="flex-1 grid grid-cols-2 gap-3 p-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-2xl bg-white/10 flex flex-col items-center justify-center gap-2"
          >
            {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <ImagePlus className="w-8 h-8" />}
            <span className="text-sm">Photo / Video</span>
          </button>
          <button
            onClick={() => setMode("text")}
            className="rounded-2xl flex flex-col items-center justify-center gap-2"
            style={{ background: STORY_BACKGROUNDS[0] }}
          >
            <Type className="w-8 h-8" />
            <span className="text-sm font-semibold">Text</span>
          </button>
        </div>
      )}

      {(mode === "media" || mode === "text") && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-3">
          <div
            className="relative w-full max-w-[380px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl"
            style={previewStyle}
            onClick={() => setSelectedOverlayId(null)}
          >
            {mode === "media" && media?.type === "video" && (
              <video
                src={media.url}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            )}

            {/* reshared post card */}
            {sharedPost && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] rounded-xl bg-white/95 text-black p-3 shadow-lg">
                <p className="text-xs font-semibold">@{sharedPost.user.username}</p>
                <p className="text-sm mt-1 line-clamp-4">{sharedPost.content}</p>
              </div>
            )}

            <StoryOverlayLayer
              overlays={overlays}
              editable
              selectedId={selectedOverlayId}
              onSelect={setSelectedOverlayId}
              onChange={patchOverlay}
            />

            {/* music pill */}
            {music && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 rounded-full pl-1 pr-3 py-1 text-xs backdrop-blur">
                {music.cover_url ? (
                  <img
                    src={music.cover_url}
                    className="w-6 h-6 rounded-full object-cover"
                    style={{ animation: "spin 5s linear infinite" }}
                    alt=""
                  />
                ) : (
                  <Music2 className="w-4 h-4 ml-1" />
                )}
                <span className="max-w-[140px] truncate">{music.title} · {music.artist}</span>
              </div>
            )}

            {/* text-story caption shown centred */}
            {mode === "text" && caption.trim() && overlays.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <p className="text-2xl font-extrabold text-center drop-shadow" style={{ whiteSpace: "pre-wrap" }}>
                  {caption}
                </p>
              </div>
            )}

            {/* selected overlay controls */}
            {selectedOverlayId && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <button
                  onClick={() => {
                    const ov = overlays.find((o) => o.id === selectedOverlayId);
                    if (ov?.type === "text") openTextEditor(ov);
                  }}
                  className="px-3 py-1 rounded-full bg-white/20 text-xs"
                >
                  Edit
                </button>
                <button onClick={removeSelectedOverlay} className="p-2 rounded-full bg-white/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* text-story: background swatches */}
          {mode === "text" && (
            <div className="flex gap-2 mt-3 overflow-x-auto max-w-full">
              {STORY_BACKGROUNDS.map((bg, i) => (
                <button
                  key={i}
                  onClick={() => setBgIndex(i)}
                  className={`w-8 h-8 rounded-full shrink-0 border-2 ${i === bgIndex ? "border-white" : "border-transparent"}`}
                  style={{ background: bg }}
                />
              ))}
            </div>
          )}

          {/* caption */}
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={mode === "text" ? "Type something…" : "Add a caption…"}
            className="mt-3 w-full max-w-[380px] rounded-full bg-white/10 px-4 py-2 text-sm outline-none placeholder:text-white/50"
          />
        </div>
      )}

      {/* tool rail */}
      {(mode === "media" || mode === "text") && (
        <div className="flex items-center justify-around px-2 py-3 border-t border-white/10">
          <ToolButton icon={<Type className="w-5 h-5" />} label="Text" onClick={() => openTextEditor()} />
          <ToolButton icon={<Smile className="w-5 h-5" />} label="Sticker" onClick={() => setShowEmoji(true)} />
          <ToolButton icon={<Link2 className="w-5 h-5" />} label="Link" onClick={addLink} />
          <ToolButton icon={<BarChart3 className="w-5 h-5" />} label="Poll" onClick={addPoll} />
          <ToolButton
            icon={<Music2 className="w-5 h-5" />}
            label={music ? "Music ✓" : "Music"}
            onClick={() => setShowMusic(true)}
          />
        </div>
      )}

      {/* bottom action bar */}
      {(mode === "media" || mode === "text") && (
        <div className="flex items-center gap-3 p-3 border-t border-white/10">
          <div className="relative">
            <button
              onClick={() => setShowVisibility((v) => !v)}
              className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-xs"
            >
              {VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.label}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showVisibility && (
              <div className="absolute bottom-full mb-2 left-0 w-52 rounded-xl bg-neutral-900 border border-white/10 overflow-hidden">
                {VISIBILITY_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => {
                      setVisibility(o.value);
                      setShowVisibility(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-white/10"
                  >
                    <p className="text-sm flex items-center gap-2">
                      {o.label}
                      {visibility === o.value && <Check className="w-3 h-3" />}
                    </p>
                    <p className="text-[11px] text-white/50">{o.hint}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={share}
            disabled={!canShare || posting}
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white text-black font-semibold py-2.5 disabled:opacity-50"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Share to story
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {showMusic && (
        <MusicPicker
          value={music}
          onChange={setMusic}
          onClose={() => setShowMusic(false)}
        />
      )}

      {showEmoji && (
        <div className="absolute inset-0 z-40 bg-black/95 flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b border-white/10">
            <button onClick={() => setShowEmoji(false)}><X className="w-6 h-6" /></button>
            <span className="font-semibold">Add a sticker</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <EmojiPicker
              theme={"dark" as never}
              width="100%"
              height="100%"
              onEmojiClick={(d: { emoji: string }) => addEmoji(d.emoji)}
              lazyLoadEmojis
            />
          </div>
        </div>
      )}

      {textDraft.open && (
        <div className="absolute inset-0 z-40 bg-black/80 flex flex-col p-4">
          <textarea
            autoFocus
            value={textDraft.value}
            onChange={(e) => setTextDraft((d) => ({ ...d, value: e.target.value }))}
            placeholder="Type…"
            className="flex-1 bg-transparent text-center text-3xl font-extrabold outline-none resize-none"
            style={{ color: textDraft.color, fontFamily: textDraft.font }}
          />
          <div className="flex items-center gap-2 overflow-x-auto py-2">
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setTextDraft((d) => ({ ...d, color: c }))}
                className={`w-7 h-7 rounded-full shrink-0 border-2 ${textDraft.color === c ? "border-white" : "border-white/30"}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 py-2">
            {FONT_FAMILIES.map((f) => (
              <button
                key={f.value}
                onClick={() => setTextDraft((d) => ({ ...d, font: f.value }))}
                className={`px-3 py-1 rounded-full text-xs ${textDraft.font === f.value ? "bg-white text-black" : "bg-white/10"}`}
                style={{ fontFamily: f.value }}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={() => setTextDraft((d) => ({ ...d, bg: !d.bg }))}
              className={`px-3 py-1 rounded-full text-xs ${textDraft.bg ? "bg-white text-black" : "bg-white/10"}`}
            >
              BG
            </button>
          </div>
          <button
            onClick={commitText}
            className="mt-2 rounded-full bg-white text-black font-semibold py-2"
          >
            Done
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}

function ToolButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 text-[11px] text-white/80">
      <span className="p-2 rounded-full bg-white/10">{icon}</span>
      {label}
    </button>
  );
}
