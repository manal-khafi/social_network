import type { RefObject } from "react";
import { Type, ImagePlus, Loader2 } from "lucide-react";
import { STORY_BACKGROUNDS } from "../storyConfig";
import type { Mode } from "./types";
import { useTranslation } from "react-i18next";

interface StoryModeChooserProps {
  fileRef: RefObject<HTMLInputElement | null>;
  uploading: boolean;
  setMode: (mode: Mode) => void;
}

/** First step of the composer: pick a photo / video, or start a text story. */
export default function StoryModeChooser({ fileRef, uploading, setMode }: StoryModeChooserProps) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 grid grid-cols-2 gap-3 p-4">
      <button
        onClick={() => fileRef.current?.click()}
        className="rounded-2xl bg-white/10 flex flex-col items-center justify-center gap-2"
      >
        {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <ImagePlus className="w-8 h-8" />}
        <span className="text-sm">{t("messages.photoVideo")}</span>
      </button>
      <button
        onClick={() => setMode("text")}
        className="rounded-2xl flex flex-col items-center justify-center gap-2"
        style={{ background: STORY_BACKGROUNDS[0] }}
      >
        <Type className="w-8 h-8" />
        <span className="text-sm font-semibold">{t("stories.text")}</span>
      </button>
    </div>
  );
}
