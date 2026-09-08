import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { StoryOverlay } from "../../api/storiesApi";

interface Props {
  overlays: StoryOverlay[];
  /** When set, overlays can be dragged and this reports new relative positions. */
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onChange?: (id: string, patch: Partial<StoryOverlay>) => void;
}

/**
 * Renders draggable text / emoji / mention overlays positioned as a fraction of
 * the story canvas (x,y in 0..1 = centre of the element).
 */
export default function StoryOverlayLayer({
  overlays,
  editable = false,
  selectedId,
  onSelect,
  onChange,
}: Props) {
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

  return (
    <div
      ref={layerRef}
      className="absolute inset-0"
      style={{ touchAction: editable ? "none" : "auto" }}
    >
      {overlays.map((ov) => {
        const isEmoji = ov.type === "emoji";
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
            }}
          >
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
                outline: selected ? "2px dashed rgba(255,255,255,0.9)" : "none",
                outlineOffset: 4,
              }}
            >
              {ov.type === "mention" ? `@${ov.text}` : ov.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}
