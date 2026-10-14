import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { createStory } from "../../features/stories/storiesSlice";
import { uploadStoryMedia } from "../../utils/uploadStoryMedia";
import type { StoryOverlay, StoryVisibility, SharedPostRef } from "../../api/storiesApi";
import MusicPicker, { type SelectedMusic } from "./MusicPicker";
import MentionPicker from "./MentionPicker";
import GifPicker from "./GifPicker";
import { STORY_BACKGROUNDS, FONT_FAMILIES } from "./storyConfig";
import StoryModeChooser from "./components/StoryModeChooser";
import StoryCanvas from "./components/StoryCanvas";
import StoryToolRail from "./components/StoryToolRail";
import StoryShareBar from "./components/StoryShareBar";
import EmojiStickerPanel from "./components/EmojiStickerPanel";
import TextOverlayEditor from "./components/TextOverlayEditor";
import StickerEditor from "./components/StickerEditor";
import type { Mode } from "./components/types";

interface Props {
  open: boolean;
  onClose: () => void;
  sharedPost?: SharedPostRef | null;
}


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
  const [showMention, setShowMention] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [stickerDraft, setStickerDraft] = useState<{
    kind: "link" | "poll" | "question";
    url: string;
    label: string;
    question: string;
    options: string[];
    prompt: string;
  } | null>(null);
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
      open && (mode === "media" || mode === "text") && !showMusic && !showEmoji && !textDraft.open && !stickerDraft;
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
  }, [open, mode, showMusic, showEmoji, textDraft.open, stickerDraft, music?.preview_url, music?.start_sec]);

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

  const openSticker = (kind: "link" | "poll" | "question") =>
    setStickerDraft({ kind, url: "", label: "", question: "", options: ["", ""], prompt: "" });

  const commitSticker = () => {
    if (!stickerDraft) return;
    const d = stickerDraft;

    if (d.kind === "link") {
      const url = d.url.trim();
      if (!/^https?:\/\//i.test(url)) {
        toast.error("Link must start with http:// or https://");
        return;
      }
      setOverlays((prev) => [
        ...prev,
        {
          id: uid(),
          type: "link",
          url,
          label: d.label.trim() || undefined,
          x: 0.5,
          y: 0.72,
          rotation: 0,
          scale: 1,
        },
      ]);
    } else if (d.kind === "poll") {
      const question = d.question.trim();
      const options = d.options.map((o) => o.trim()).filter(Boolean);
      if (!question) return toast.error("Add a poll question");
      if (options.length < 2) return toast.error("A poll needs at least two options");
      setOverlays((prev) => [
        ...prev,
        {
          id: uid(),
          type: "poll",
          question,
          options: options.slice(0, 4),
          x: 0.5,
          y: 0.5,
          rotation: 0,
          scale: 1,
        },
      ]);
    } else {
      const prompt = d.prompt.trim();
      if (!prompt) return toast.error("Type your question");
      setOverlays((prev) => [
        ...prev,
        { id: uid(), type: "question", prompt, x: 0.5, y: 0.5, rotation: 0, scale: 1 },
      ]);
    }
    setStickerDraft(null);
  };

  const addGif = (gif: { url: string; width: number; height: number }) => {
    setOverlays((prev) => [
      ...prev,
      { id: uid(), type: "gif", gifUrl: gif.url, x: 0.5, y: 0.5, rotation: 0, scale: 1 },
    ]);
    setShowGif(false);
  };

  const addMention = (username: string) => {
    setOverlays((prev) => [
      ...prev,
      { id: uid(), type: "mention", text: username, x: 0.5, y: 0.62, rotation: 0, scale: 1 },
    ]);
    setShowMention(false);
  };

  const canShare =
    mode === "media"
      ? !!media
      : mode === "text"
      ? caption.trim().length > 0 || overlays.length > 0 || !!sharedPost
      : false;

  const background = STORY_BACKGROUNDS[bgIndex];

  // emoji-picker-react needs an explicit pixel height — "100%" collapses it to
  // zero inside the flex column, which made the sticker panel look empty/broken.
  const emojiPickerHeight = Math.min(
    Math.max(typeof window !== "undefined" ? window.innerHeight - 140 : 480, 320),
    560
  );

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
        <StoryModeChooser fileRef={fileRef} uploading={uploading} setMode={setMode} />
      )}

      {(mode === "media" || mode === "text") && (
        <StoryCanvas
          mode={mode}
          media={media}
          previewStyle={previewStyle}
          sharedPost={sharedPost}
          overlays={overlays}
          selectedOverlayId={selectedOverlayId}
          setSelectedOverlayId={setSelectedOverlayId}
          patchOverlay={patchOverlay}
          openTextEditor={openTextEditor}
          removeSelectedOverlay={removeSelectedOverlay}
          music={music}
          caption={caption}
          setCaption={setCaption}
          bgIndex={bgIndex}
          setBgIndex={setBgIndex}
        />
      )}

      {/* tool rail */}
      {(mode === "media" || mode === "text") && (
        <StoryToolRail
          openTextEditor={() => openTextEditor()}
          setShowEmoji={setShowEmoji}
          setShowGif={setShowGif}
          setShowMention={setShowMention}
          openSticker={openSticker}
          music={music}
          setShowMusic={setShowMusic}
        />
      )}

      {/* bottom action bar */}
      {(mode === "media" || mode === "text") && (
        <StoryShareBar
          visibility={visibility}
          setVisibility={setVisibility}
          showVisibility={showVisibility}
          setShowVisibility={setShowVisibility}
          share={share}
          canShare={canShare}
          posting={posting}
        />
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

      {showMention && (
        <MentionPicker onPick={addMention} onClose={() => setShowMention(false)} />
      )}

      {showGif && <GifPicker onPick={addGif} onClose={() => setShowGif(false)} />}

      {showEmoji && (
        <EmojiStickerPanel
          setShowEmoji={setShowEmoji}
          emojiPickerHeight={emojiPickerHeight}
          addEmoji={addEmoji}
        />
      )}

      {textDraft.open && (
        <TextOverlayEditor
          textDraft={textDraft}
          setTextDraft={setTextDraft}
          commitText={commitText}
        />
      )}

      {stickerDraft && (
        <StickerEditor
          stickerDraft={stickerDraft}
          setStickerDraft={setStickerDraft}
          commitSticker={commitSticker}
        />
      )}
    </div>,
    document.body
  );
}
