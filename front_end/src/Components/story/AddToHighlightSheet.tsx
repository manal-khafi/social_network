import { useEffect, useState } from "react";
import { X, Plus, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getUserHighlights,
  createHighlight,
  addToHighlight,
  type HighlightSummary,
} from "../../api/highlightsApi";

interface Props {
  storyId: string;
  ownerId: string;
  onClose: () => void;
}

export default function AddToHighlightSheet({ storyId, ownerId, onClose }: Props) {
  const [highlights, setHighlights] = useState<HighlightSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    getUserHighlights(ownerId)
      .then(setHighlights)
      .catch(() => setHighlights([]))
      .finally(() => setLoading(false));
  }, [ownerId]);

  const addToExisting = async (h: HighlightSummary) => {
    setBusy(h.id);
    try {
      await addToHighlight(h.id, [storyId]);
      toast.success(`Added to “${h.title}”`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add");
    } finally {
      setBusy(null);
    }
  };

  const create = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setBusy("__new");
    try {
      await createHighlight({ title, story_ids: [storyId] });
      toast.success(`Highlight “${title}” created`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-neutral-900 text-white rounded-t-2xl max-h-[80%] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <span className="font-semibold">Add to Highlight</span>
          <button onClick={onClose} aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-3">
          {creating ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && create()}
                placeholder="Highlight name"
                maxLength={60}
                className="flex-1 rounded-full bg-white/10 px-4 py-2 text-sm outline-none"
              />
              <button
                onClick={create}
                disabled={!newTitle.trim() || busy === "__new"}
                className="rounded-full bg-white text-black text-sm font-semibold px-4 py-2 disabled:opacity-50"
              >
                {busy === "__new" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
            >
              <span className="w-11 h-11 rounded-full border border-white/30 grid place-items-center">
                <Plus className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium">New highlight</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-6">
          {loading ? (
            <div className="py-8 grid place-items-center">
              <Loader2 className="w-5 h-5 animate-spin text-white/50" />
            </div>
          ) : (
            highlights.map((h) => (
              <button
                key={h.id}
                onClick={() => addToExisting(h)}
                disabled={busy === h.id}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
              >
                <span className="w-11 h-11 rounded-full overflow-hidden bg-white/10 grid place-items-center">
                  {h.cover_url ? (
                    <img src={h.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-medium truncate">{h.title}</p>
                  <p className="text-xs text-white/50">{h.item_count} items</p>
                </div>
                {busy === h.id && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
