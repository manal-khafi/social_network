import { useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { TEXT_COLORS, FONT_FAMILIES } from "../storyConfig";
import type { TextDraft } from "./types";
import { useTranslation } from "react-i18next";
import { useMentionAutocomplete } from "../../../Components/mention/useMentionAutocomplete";

interface TextOverlayEditorProps {
  textDraft: TextDraft;
  setTextDraft: Dispatch<SetStateAction<TextDraft>>;
  commitText: () => void;
}

/** Full-screen editor for a text overlay: content, colour, font and background. */
export default function TextOverlayEditor({
  textDraft,
  setTextDraft,
  commitText,
}: TextOverlayEditorProps) {
  const { t } = useTranslation();
  const mentionRef = useRef<HTMLTextAreaElement>(null);
  const mention = useMentionAutocomplete<HTMLTextAreaElement>(
    mentionRef,
    textDraft.value,
    (value) => setTextDraft((d) => ({ ...d, value })),
    { theme: "dark" }
  );
  return (
    <div className="absolute inset-0 z-40 bg-black/80 flex flex-col p-4">
      <div className="relative flex-1 flex flex-col min-h-0">
        <textarea
          ref={mentionRef}
          autoFocus
          value={textDraft.value}
          onChange={(e) => setTextDraft((d) => ({ ...d, value: e.target.value }))}
          onSelect={mention.onSelect}
          onKeyDown={mention.handleKeyDown}
          onBlur={mention.onBlur}
          placeholder={t("stories.type")}
          className="flex-1 bg-transparent text-center text-3xl font-extrabold outline-none resize-none"
          style={{ color: textDraft.color, fontFamily: textDraft.font }}
        />
        {mention.dropdown}
      </div>
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
            {t(f.label)}
          </button>
        ))}
        <button
          onClick={() => setTextDraft((d) => ({ ...d, bg: !d.bg }))}
          className={`px-3 py-1 rounded-full text-xs ${textDraft.bg ? "bg-white text-black" : "bg-white/10"}`}
        >
          {t("stories.textBackground")}
        </button>
      </div>
      <button
        onClick={commitText}
        className="mt-2 rounded-full bg-white text-black font-semibold py-2"
      >
        {t("actions.done")}
      </button>
    </div>
  );
}
