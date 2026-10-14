import { useEffect, useRef, useState } from "react";
import { Undo2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TEXT_COLORS } from "../storyConfig";

type Point = { x: number; y: number };
type Stroke = { color: string; width: number; points: Point[] };

const BRUSH_SIZES = [4, 8, 16];

interface DrawingEditorProps {
  /** The drawing as a transparent PNG the size of the canvas (null = nothing drawn). */
  onDone: (png: Blob | null) => void;
  saving: boolean;
}

/** Free-hand drawing over the story canvas. Fills its (relative) parent. */
export default function DrawingEditor({ onDone, saving }: DrawingEditorProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState(TEXT_COLORS[0]);
  const [size, setSize] = useState(BRUSH_SIZES[1]);
  const current = useRef<Stroke | null>(null);

  const redraw = (list: Stroke[]) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = canvas.width;
    for (const s of list) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width * (scale / 360);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      s.points.forEach((p, i) =>
        i === 0 ? ctx.moveTo(p.x * canvas.width, p.y * canvas.height) : ctx.lineTo(p.x * canvas.width, p.y * canvas.height)
      );
      if (s.points.length === 1) ctx.lineTo(s.points[0].x * canvas.width + 0.1, s.points[0].y * canvas.height);
      ctx.stroke();
    }
  };

  // Match the canvas resolution to its on-screen size (sharp on retina screens).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      redraw(strokes);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const point = (e: React.PointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    current.current = { color, width: size, points: [point(e)] };
    redraw([...strokes, current.current]);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!current.current) return;
    current.current.points.push(point(e));
    redraw([...strokes, current.current]);
  };
  const onUp = () => {
    if (!current.current) return;
    const next = [...strokes, current.current];
    current.current = null;
    setStrokes(next);
    redraw(next);
  };

  const undo = () => {
    const next = strokes.slice(0, -1);
    setStrokes(next);
    redraw(next);
  };

  const done = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) return onDone(null);
    canvas.toBlob((blob) => onDone(blob), "image/png");
  };

  return (
    <div className="absolute inset-0 z-20">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />

      <div className="absolute top-0 inset-x-0 flex items-center justify-between p-3">
        <button
          onClick={undo}
          disabled={strokes.length === 0 || saving}
          aria-label={t("stories.undo")}
          className="p-2 rounded-full bg-black/40 disabled:opacity-40"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          {BRUSH_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              aria-label={`${s}px`}
              className={`grid place-items-center w-8 h-8 rounded-full ${size === s ? "bg-white/30" : "bg-black/30"}`}
            >
              <span className="block rounded-full bg-white" style={{ width: s / 1.5 + 2, height: s / 1.5 + 2 }} />
            </button>
          ))}
        </div>
        <button
          onClick={done}
          disabled={saving}
          className="rounded-full bg-white text-black text-sm font-semibold px-4 py-1.5 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("actions.done")}
        </button>
      </div>

      <div className="absolute bottom-3 inset-x-0 flex justify-center gap-2 px-3 overflow-x-auto [scrollbar-width:none]">
        {TEXT_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            aria-label={c}
            className={`w-7 h-7 shrink-0 rounded-full border-2 ${color === c ? "border-white scale-110" : "border-white/40"}`}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );
}
