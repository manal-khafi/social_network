import { X } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useTranslation } from "react-i18next";

interface EmojiStickerPanelProps {
  setShowEmoji: (open: boolean) => void;
  emojiPickerHeight: number;
  addEmoji: (emoji: string) => void;
}

/** Full-screen emoji picker used to add an emoji sticker. */
export default function EmojiStickerPanel({
  setShowEmoji,
  emojiPickerHeight,
  addEmoji,
}: EmojiStickerPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="absolute inset-0 z-40 bg-black/95 flex flex-col">
      <div className="flex items-center gap-2 p-3 border-b border-white/10">
        <button onClick={() => setShowEmoji(false)}><X className="w-6 h-6" /></button>
        <span className="font-semibold">{t("stories.addASticker")}</span>
      </div>
      <div className="flex-1 min-h-0 flex justify-center overflow-y-auto p-3">
        <div className="w-full max-w-[420px]">
          <EmojiPicker
            theme={"dark" as never}
            width="100%"
            height={emojiPickerHeight}
            onEmojiClick={(d: { emoji: string }) => addEmoji(d.emoji)}
            lazyLoadEmojis
          />
        </div>
      </div>
    </div>
  );
}
