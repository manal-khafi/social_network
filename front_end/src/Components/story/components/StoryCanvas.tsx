import type { CSSProperties } from "react";
import { Music2, Trash2 } from "lucide-react";
import type { StoryOverlay, SharedPostRef } from "../../../api/storiesApi";
import type { SelectedMusic } from "../MusicPicker";
import StoryOverlayLayer from "../StoryOverlayLayer";
import { STORY_BACKGROUNDS } from "../storyConfig";
import type { Mode, StoryMedia } from "./types";
import { useTranslation } from "react-i18next";

interface StoryCanvasProps {
  mode: Mode;
  media: StoryMedia | null;
  previewStyle: CSSProperties;
  sharedPost: SharedPostRef | null;
  overlays: StoryOverlay[];
  selectedOverlayId: string | null;
  setSelectedOverlayId: (id: string | null) => void;
  patchOverlay: (id: string, patch: Partial<StoryOverlay>) => void;
  openTextEditor: (existing?: StoryOverlay) => void;
  removeSelectedOverlay: () => void;
  music: SelectedMusic | null;
  caption: string;
  setCaption: (value: string) => void;
  bgIndex: number;
  setBgIndex: (index: number) => void;
}

/**
 * The 9:16 editing canvas (media or coloured background, overlays, music pill,
 * selected-overlay controls) with the background swatches and caption input
 * underneath.
 */
export default function StoryCanvas({
  mode,
  media,
  previewStyle,
  sharedPost,
  overlays,
  selectedOverlayId,
  setSelectedOverlayId,
  patchOverlay,
  openTextEditor,
  removeSelectedOverlay,
  music,
  caption,
  setCaption,
  bgIndex,
  setBgIndex,
}: StoryCanvasProps) {
  const { t } = useTranslation();
  return (
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
          <div className="absolute top-3 start-3 flex items-center gap-2 bg-black/50 rounded-full ps-1 pe-3 py-1 text-xs backdrop-blur">
            {music.cover_url ? (
              <img
                src={music.cover_url}
                className="w-6 h-6 rounded-full object-cover"
                style={{ animation: "spin 5s linear infinite" }}
                alt=""
              />
            ) : (
              <Music2 className="w-4 h-4 ms-1" />
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
              {t("actions.edit")}
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
        placeholder={mode === "text" ? t("stories.typeSomething") : t("stories.addACaption")}
        className="mt-3 w-full max-w-[380px] rounded-full bg-white/10 px-4 py-2 text-sm outline-none placeholder:text-white/50"
      />
    </div>
  );
}
