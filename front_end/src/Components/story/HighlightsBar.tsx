import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserHighlights, type HighlightSummary } from "../../api/highlightsApi";

interface Props {
  userId: string;
}

/** Circular highlight covers shown on a profile. */
export default function HighlightsBar({ userId }: Props) {
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState<HighlightSummary[]>([]);

  useEffect(() => {
    let active = true;
    getUserHighlights(userId)
      .then((h) => active && setHighlights(h))
      .catch(() => active && setHighlights([]));
    return () => {
      active = false;
    };
  }, [userId]);

  if (highlights.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto px-4 py-3 border-b border-border">
      {highlights.map((h) => (
        <button
          key={h.id}
          onClick={() => navigate(`/home/highlights/${h.id}`)}
          className="flex flex-col items-center gap-1 flex-shrink-0 w-16"
        >
          <span className="w-14 h-14 rounded-full border border-border overflow-hidden bg-muted grid place-items-center">
            {h.cover_url ? (
              <img src={h.cover_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-muted-foreground">{h.item_count}</span>
            )}
          </span>
          <span className="text-[11px] max-w-[64px] truncate">{h.title}</span>
        </button>
      ))}
    </div>
  );
}
