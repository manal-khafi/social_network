import type { ReactNode } from "react";
import { Type, Smile, Music2, Link2, BarChart3, HelpCircle, AtSign, Sticker } from "lucide-react";
import type { SelectedMusic } from "../MusicPicker";
import type { StickerKind } from "./types";
import { useTranslation } from "react-i18next";

interface StoryToolRailProps {
  openTextEditor: () => void;
  setShowEmoji: (open: boolean) => void;
  setShowGif: (open: boolean) => void;
  setShowMention: (open: boolean) => void;
  openSticker: (kind: StickerKind) => void;
  music: SelectedMusic | null;
  setShowMusic: (open: boolean) => void;
}

/** Row of tools under the canvas: text, sticker, GIF, mention, link, poll, question, music. */
export default function StoryToolRail({
  openTextEditor,
  setShowEmoji,
  setShowGif,
  setShowMention,
  openSticker,
  music,
  setShowMusic,
}: StoryToolRailProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-around px-2 py-3 border-t border-white/10">
      <ToolButton icon={<Type className="w-5 h-5" />} label={t("stories.text")} onClick={() => openTextEditor()} />
      <ToolButton icon={<Smile className="w-5 h-5" />} label={t("stories.sticker")} onClick={() => setShowEmoji(true)} />
      <ToolButton icon={<Sticker className="w-5 h-5" />} label={t("stories.gif")} onClick={() => setShowGif(true)} />
      <ToolButton icon={<AtSign className="w-5 h-5" />} label={t("stories.mention")} onClick={() => setShowMention(true)} />
      <ToolButton icon={<Link2 className="w-5 h-5" />} label={t("stories.link")} onClick={() => openSticker("link")} />
      <ToolButton icon={<BarChart3 className="w-5 h-5" />} label={t("messages.poll")} onClick={() => openSticker("poll")} />
      <ToolButton icon={<HelpCircle className="w-5 h-5" />} label={t("stories.question")} onClick={() => openSticker("question")} />
      <ToolButton
        icon={<Music2 className="w-5 h-5" />}
        label={music ? t("stories.music2") : t("stories.music")}
        onClick={() => setShowMusic(true)}
      />
    </div>
  );
}

function ToolButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
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
