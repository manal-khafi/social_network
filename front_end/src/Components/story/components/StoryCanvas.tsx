import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Music2, Trash2 } from "lucide-react";
import type { StoryOverlay, SharedPostRef } from "../../../api/storiesApi";
import type { SelectedMusic } from "../MusicPicker";
import StoryOverlayLayer from "../StoryOverlayLayer";
import type { Mode, StoryMedia } from "./types";
import { useTranslation } from "react-i18next";
import { useMentionAutocomplete } from "../../../Components/mention/useMentionAutocomplete";
import type { MessageStoryPreview } from "../../../api/messagesApi";

interface StoryCanvasProps {
  mode: Mode;
  media: StoryMedia | null;
  previewStyle: CSSProperties;
  sharedPost: SharedPostRef | null;
  sharedStory?: MessageStoryPreview | null;
  overlays: StoryOverlay[];
  selectedOverlayId: string | null;
  setSelectedOverlayId: (id: string | null) => void;
  patchOverlay: (id: string, patch: Partial<StoryOverlay>) => void;
  openTextEditor: (existing?: StoryOverlay) => void;
  removeSelectedOverlay: () => void;
  music: SelectedMusic | null;
  caption: string;
  setCaption: (value: string) => void;
  /** Rendered on top of the canvas (tool rail, drawing layer). */
  children?: ReactNode;
}

/**
 * The 9:16 editing canvas (media or coloured background, overlays, music pill,
 * selected-overlay controls). It fills the space it is given while keeping its
 * 9:16 shape, so it is full-bleed on a phone and centred on a wide screen.
 */
export default function StoryCanvas({
  mode,
  media,
  previewStyle,
  sharedPost,
  sharedStory = null,
  overlays,
  selectedOverlayId,
  setSelectedOverlayId,
  patchOverlay,
  openTextEditor,
  removeSelectedOverlay,
  music,
  caption,
  setCaption,
  children,
}: StoryCanvasProps) {
  const { t } = useTranslation();
  const mentionRef = useRef<HTMLTextAreaElement>(null);
  const mention = useMentionAutocomplete<HTMLTextAreaElement>(
    mentionRef, caption, setCaption, { theme: "dark" });
  return (
    <div className="relative flex-1 min-h-0 w-full flex items-center justify-center">
      <div
        className="relative w-full max-w-[min(100%,calc((100dvh-9rem)*9/16))] aspect-[9/16] max-h-full overflow-hidden sm:rounded-2xl"
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

        {/* re-shared story card */}
        {sharedStory && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[62%] aspect-[9/16] rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/80">
            {sharedStory.content_type === "text" ? (
              <div
                className="w-full h-full grid place-items-center p-3 text-center text-sm font-bold"
                style={{ background: sharedStory.bg_color ?? "#111827" }}
              >
                {sharedStory.caption || sharedStory.content_url}
              </div>
            ) : (
              <img src={sharedStory.thumbnail_url || sharedStory.content_url} alt="" className="w-full h-full object-cover" />
            )}
            <span className="absolute top-2 start-2 text-xs font-semibold bg-black/50 rounded-full px-2 py-0.5">
              @{sharedStory.user.username}
            </span>
          </div>
        )}

        {/* text story: type straight onto the background */}
        {mode === "text" && !sharedPost && !sharedStory && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative w-full">
            <textarea
              ref={mentionRef}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onSelect={mention.onSelect}
              onKeyDown={mention.handleKeyDown}
              onBlur={mention.onBlur}
              onClick={(e) => e.stopPropagation()}
              placeholder={t("stories.typeSomething")}
              rows={4}
              maxLength={500}
              className="w-full bg-transparent text-center text-3xl font-extrabold text-white placeholder:text-white/60 outline-none resize-none drop-shadow"
            />
            {mention.dropdown}
            </div>
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
          <div className="absolute top-3 start-3 flex items-center gap-2 bg-black/50 rounded-full ps-1 pe-3 py-1 text-xs backdrop-blur max-w-[calc(100%-4.5rem)]">
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
            <span className="truncate">{music.title} · {music.artist}</span>
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
              className="px-3 py-1 rounded-full bg-black/40 text-xs"
            >
              {t("actions.edit")}
            </button>
            <button onClick={removeSelectedOverlay} className="p-2 rounded-full bg-black/40">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
