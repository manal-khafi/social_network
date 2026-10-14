import type { ReactNode } from "react";
import { Type, Smile, Music2, Link2, BarChart3, HelpCircle, AtSign, Sticker, PenLine } from "lucide-react";
import type { SelectedMusic } from "../MusicPicker";
import type { StickerKind } from "./types";
import { useTranslation } from "react-i18next";

interface StoryToolRailProps {
  openTextEditor: () => void;
  setShowEmoji: (open: boolean) => void;
  setShowGif: (open: boolean) => void;
  setShowMention: (open: boolean) => void;
  openSticker: (kind: StickerKind) => void;
  openDrawing: () => void;
  music: SelectedMusic | null;
  setShowMusic: (open: boolean) => void;
}

/**
 * Vertical tool column on the side of the canvas (Instagram style): text,
 * sticker, draw, then GIF, mention, link, poll, question and music.
 */
export default function StoryToolRail({
  openTextEditor,
  setShowEmoji,
  setShowGif,
  setShowMention,
  openSticker,
  openDrawing,
  music,
  setShowMusic,
}: StoryToolRailProps) {
  const { t } = useTranslation();
  return (
    <div className="absolute top-3 end-3 z-10 flex flex-col items-center gap-2 max-h-[calc(100%-1.5rem)] overflow-y-auto [scrollbar-width:none]">
      <ToolButton label={t("stories.text")} onClick={() => openTextEditor()}>
        <span className="text-base font-bold leading-none">Aa</span>
      </ToolButton>
      <ToolButton label={t("stories.sticker")} onClick={() => setShowEmoji(true)}>
        <Smile className="w-5 h-5" />
      </ToolButton>
      <ToolButton label={t("stories.draw")} onClick={openDrawing}>
        <PenLine className="w-5 h-5" />
      </ToolButton>
      <ToolButton label={t("stories.gif")} onClick={() => setShowGif(true)}>
        <Sticker className="w-5 h-5" />
      </ToolButton>
      <ToolButton label={t("stories.mention")} onClick={() => setShowMention(true)}>
        <AtSign className="w-5 h-5" />
      </ToolButton>
      <ToolButton label={t("stories.link")} onClick={() => openSticker("link")}>
        <Link2 className="w-5 h-5" />
      </ToolButton>
      <ToolButton label={t("messages.poll")} onClick={() => openSticker("poll")}>
        <BarChart3 className="w-5 h-5" />
      </ToolButton>
      <ToolButton label={t("stories.question")} onClick={() => openSticker("question")}>
        <HelpCircle className="w-5 h-5" />
      </ToolButton>
      <ToolButton label={music ? t("stories.music2") : t("stories.music")} onClick={() => setShowMusic(true)} active={!!music}>
        <Music2 className="w-5 h-5" />
      </ToolButton>
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  active = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={`grid place-items-center w-10 h-10 shrink-0 rounded-full backdrop-blur ${
        active ? "bg-white text-black" : "bg-black/40 text-white"
      }`}
    >
      {children}
    </button>
  );
}
