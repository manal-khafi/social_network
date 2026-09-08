import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { StoryOverlay } from "../../api/storiesApi";

export interface PollState {
  counts: Record<number, number> | null;
  total: number;
  my_choice: number | null;
}

interface Props {
  overlays: StoryOverlay[];
  /** When set, overlays can be dragged and this reports new relative positions. */
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onChange?: (id: string, patch: Partial<StoryOverlay>) => void;
  /** Viewer-side: poll results keyed by overlay id, and a vote handler. */
  pollResults?: Record<string, PollState>;
  onPollVote?: (overlayId: string, optionIndex: number) => void;
  /** Viewer-side: question sticker handlers. */
  onQuestionSubmit?: (overlayId: string, answer: string) => void;
  onQuestionOpen?: (overlayId: string) => void;
  questionAuthorView?: boolean;
  onMentionTap?: (username: string) => void;
}

const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

/**
 * Renders draggable text / emoji / mention / link / poll overlays positioned as
 * a fraction of the story canvas (x,y in 0..1 = centre of the element).
 */
export default function StoryOverlayLayer({
  overlays,
  editable = false,
  selectedId,
  onSelect,
  onChange,
  pollResults,
  onPollVote,
  onQuestionSubmit,
  onQuestionOpen,
  questionAuthorView,
  onMentionTap,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const layerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ id: string; pointerId: number } | null>(null);

  const handlePointerDown = (e: ReactPointerEvent, ov: StoryOverlay) => {
    if (!editable) return;
    e.stopPropagation();
    onSelect?.(ov.id);
    dragState.current = { id: ov.id, pointerId: e.pointerId };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent) => {
    if (!editable || !dragState.current || !layerRef.current) return;
    const rect = layerRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    onChange?.(dragState.current.id, { x, y });
  };

  const handlePointerUp = (e: ReactPointerEvent) => {
    if (dragState.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(dragState.current.pointerId);
      } catch {
        /* no-op */
      }
      dragState.current = null;
    }
  };

  const renderContent = (ov: StoryOverlay) => {
    if (ov.type === "link") {
      const label = ov.label?.trim() || ov.url?.replace(/^https?:\/\//, "").slice(0, 24) || "Link";
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!editable && ov.url) window.open(ov.url, "_blank", "noopener,noreferrer");
          }}
          className="flex items-center gap-1 rounded-full bg-white text-black text-sm font-semibold px-3 py-1.5 shadow"
        >
          🔗 {label}
        </button>
      );
    }

    if (ov.type === "poll") {
      const options = ov.options ?? [];
      const res = pollResults?.[ov.id];
      const revealed = !!res && (res.counts != null || res.my_choice != null);
      return (
        <div
          className="rounded-2xl bg-black/40 backdrop-blur px-3 py-2 w-56 text-white"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-semibold text-center mb-2">{ov.question}</p>
          <div className="flex flex-col gap-1.5">
            {options.map((opt, i) => {
              const count = res?.counts?.[i] ?? 0;
              const mine = res?.my_choice === i;
              return (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!editable) onPollVote?.(ov.id, i);
                  }}
                  className={`relative overflow-hidden rounded-full text-sm px-3 py-1.5 text-left ${
                    mine ? "bg-white text-black font-semibold" : "bg-white/20"
                  }`}
                >
                  {revealed && (
                    <span
                      className="absolute inset-y-0 left-0 bg-white/25"
                      style={{ width: `${pct(count, res!.total)}%` }}
                    />
                  )}
                  <span className="relative flex justify-between">
                    <span>{opt}</span>
                    {revealed && <span>{pct(count, res!.total)}%</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (ov.type === "question") {
      const val = answers[ov.id] ?? "";
      return (
        <div
          className="rounded-2xl bg-white text-black w-60 p-3 shadow"
          onPointerDown={(e) => editable && e.preventDefault()}
        >
          <p className="text-sm font-semibold text-center text-neutral-500 mb-2">{ov.prompt}</p>
          {editable ? (
            <div className="rounded-full bg-neutral-100 text-sm px-3 py-1.5 text-neutral-400">
              Type something…
            </div>
          ) : questionAuthorView ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuestionOpen?.(ov.id);
              }}
              className="w-full rounded-full bg-neutral-100 text-sm py-1.5 font-medium"
            >
              View responses
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <input
                value={val}
                onChange={(e) => setAnswers((a) => ({ ...a, [ov.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && val.trim()) {
                    onQuestionSubmit?.(ov.id, val.trim());
                    setAnswers((a) => ({ ...a, [ov.id]: "" }));
                  }
                }}
                placeholder="Type something…"
                className="flex-1 rounded-full bg-neutral-100 text-sm px-3 py-1.5 outline-none"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (val.trim()) {
                    onQuestionSubmit?.(ov.id, val.trim());
                    setAnswers((a) => ({ ...a, [ov.id]: "" }));
                  }
                }}
                className="text-sm font-semibold text-sky-600 px-2"
              >
                Send
              </button>
            </div>
          )}
        </div>
      );
    }

    if (ov.type === "mention") {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!editable && ov.text) onMentionTap?.(ov.text);
          }}
          className="rounded-lg bg-black/40 text-white font-bold px-2 py-1 text-lg drop-shadow"
        >
          @{ov.text}
        </button>
      );
    }

    const isEmoji = ov.type === "emoji";
    return (
      <div
        style={{
          fontFamily: ov.fontFamily,
          color: ov.color ?? "#ffffff",
          background: ov.background ?? "transparent",
          padding: ov.background ? "4px 10px" : 0,
          borderRadius: ov.background ? 8 : 0,
          fontSize: isEmoji ? 44 : 28,
          fontWeight: isEmoji ? 400 : 800,
          lineHeight: 1.15,
          textShadow: ov.background ? "none" : "0 1px 6px rgba(0,0,0,0.45)",
          whiteSpace: "pre-wrap",
          textAlign: "center",
          maxWidth: "80vw",
        }}
      >
        {ov.type === "mention" ? `@${ov.text}` : ov.text}
      </div>
    );
  };

  return (
    <div
      ref={layerRef}
      className="absolute inset-0"
      style={{ touchAction: editable ? "none" : "auto" }}
    >
      {overlays.map((ov) => {
        const selected = editable && selectedId === ov.id;
        return (
          <div
            key={ov.id}
            onPointerDown={(e) => handlePointerDown(e, ov)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`absolute select-none ${editable ? "cursor-move" : ""}`}
            style={{
              left: `${ov.x * 100}%`,
              top: `${ov.y * 100}%`,
              transform: `translate(-50%, -50%) rotate(${ov.rotation ?? 0}deg) scale(${ov.scale ?? 1})`,
              transformOrigin: "center",
              outline: selected ? "2px dashed rgba(255,255,255,0.9)" : "none",
              outlineOffset: 4,
            }}
          >
            {renderContent(ov)}
          </div>
        );
      })}
    </div>
  );
}
