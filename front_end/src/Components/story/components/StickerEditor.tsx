import type { Dispatch, SetStateAction } from "react";
import { X, Trash2 } from "lucide-react";
import type { StickerDraft } from "./types";

interface StickerEditorProps {
  stickerDraft: StickerDraft;
  setStickerDraft: Dispatch<SetStateAction<StickerDraft | null>>;
  commitSticker: () => void;
}

/** Full-screen form for a link, poll or question sticker. */
export default function StickerEditor({
  stickerDraft,
  setStickerDraft,
  commitSticker,
}: StickerEditorProps) {
  return (
    <div className="absolute inset-0 z-40 bg-black/85 flex flex-col text-white">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <button onClick={() => setStickerDraft(null)} aria-label="Cancel">
          <X className="w-6 h-6" />
        </button>
        <span className="font-semibold capitalize">{stickerDraft.kind} sticker</span>
        <button
          onClick={commitSticker}
          className="text-sm font-semibold text-sky-400 px-2"
        >
          Add
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-3">
          {stickerDraft.kind === "link" && (
            <>
              <input
                autoFocus
                value={stickerDraft.url}
                onChange={(e) =>
                  setStickerDraft((d) => (d ? { ...d, url: e.target.value } : d))
                }
                placeholder="https://example.com"
                inputMode="url"
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm outline-none placeholder:text-white/40"
              />
              <input
                value={stickerDraft.label}
                onChange={(e) =>
                  setStickerDraft((d) => (d ? { ...d, label: e.target.value } : d))
                }
                placeholder="Button text (optional)"
                maxLength={30}
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm outline-none placeholder:text-white/40"
              />
            </>
          )}

          {stickerDraft.kind === "poll" && (
            <>
              <input
                autoFocus
                value={stickerDraft.question}
                onChange={(e) =>
                  setStickerDraft((d) => (d ? { ...d, question: e.target.value } : d))
                }
                placeholder="Ask a question…"
                maxLength={120}
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold outline-none placeholder:text-white/40"
              />
              {stickerDraft.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={opt}
                    onChange={(e) =>
                      setStickerDraft((d) =>
                        d
                          ? {
                              ...d,
                              options: d.options.map((o, j) => (j === i ? e.target.value : o)),
                            }
                          : d
                      )
                    }
                    placeholder={`Option ${i + 1}`}
                    maxLength={40}
                    className="flex-1 rounded-xl bg-white/10 px-4 py-2.5 text-sm outline-none placeholder:text-white/40"
                  />
                  {stickerDraft.options.length > 2 && (
                    <button
                      onClick={() =>
                        setStickerDraft((d) =>
                          d ? { ...d, options: d.options.filter((_, j) => j !== i) } : d
                        )
                      }
                      className="p-2 text-white/60"
                      aria-label="Remove option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {stickerDraft.options.length < 4 && (
                <button
                  onClick={() =>
                    setStickerDraft((d) => (d ? { ...d, options: [...d.options, ""] } : d))
                  }
                  className="text-xs text-sky-400"
                >
                  + Add option
                </button>
              )}
            </>
          )}

          {stickerDraft.kind === "question" && (
            <textarea
              autoFocus
              value={stickerDraft.prompt}
              onChange={(e) =>
                setStickerDraft((d) => (d ? { ...d, prompt: e.target.value } : d))
              }
              placeholder="Ask your followers something…"
              maxLength={200}
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-base font-semibold outline-none placeholder:text-white/40 resize-none min-h-[96px]"
            />
          )}
        </div>
      </div>

      <button
        onClick={commitSticker}
        className="m-4 rounded-full bg-white text-black font-semibold py-2.5"
      >
        Add to story
      </button>
    </div>
  );
}
