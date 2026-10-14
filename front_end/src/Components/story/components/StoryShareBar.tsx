import type { Dispatch, SetStateAction } from "react";
import { Loader2, Sparkles, Check, ChevronDown } from "lucide-react";
import type { StoryVisibility } from "../../../api/storiesApi";
import { VISIBILITY_OPTIONS } from "../storyConfig";

interface StoryShareBarProps {
  visibility: StoryVisibility;
  setVisibility: (visibility: StoryVisibility) => void;
  showVisibility: boolean;
  setShowVisibility: Dispatch<SetStateAction<boolean>>;
  share: () => void;
  canShare: boolean;
  posting: boolean;
}

/** Bottom bar: audience selector and the "Share to story" button. */
export default function StoryShareBar({
  visibility,
  setVisibility,
  showVisibility,
  setShowVisibility,
  share,
  canShare,
  posting,
}: StoryShareBarProps) {
  return (
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
  );
}
