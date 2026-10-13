import { useEffect, useMemo, useState } from "react";
import { X, Search, Send, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { shareStory } from "../../features/stories/storiesSlice";
import { getFollowing, type StoryUser } from "../../api/storiesApi";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useTranslation } from "react-i18next";

interface Props {
  storyId: string;
  onClose: () => void;
}

export default function ShareStorySheet({ storyId, onClose }: Props) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.user.currentUser);
  const [people, setPeople] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!currentUser?.id) return;
    getFollowing(currentUser.id)
      .then(setPeople)
      .catch(() => setPeople([]))
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) =>
        p.username.toLowerCase().includes(q) ||
        p.display_name.toLowerCase().includes(q)
    );
  }, [people, query]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const send = async () => {
    if (selected.size === 0 || sending) return;
    setSending(true);
    try {
      const res = await dispatch(
        shareStory({ storyId, recipientIds: [...selected], note: note.trim() || undefined })
      ).unwrap();
      toast.success(t("stories.sentToCount", { count: res.shared_count }));
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("stories.couldNotSend"));
    } finally {
      setSending(false);
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
          <span className="font-semibold">{t("stories.sendTo")}</span>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
            <Search className="w-4 h-4 text-white/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("actions.search")}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {loading && (
            <div className="py-10 grid place-items-center">
              <Loader2 className="w-5 h-5 animate-spin text-white/50" />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-center text-sm text-white/50 py-10">{t("stories.noOneToSendToYet")}</p>
          )}
          {filtered.map((p) => {
            const isSel = selected.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
              >
                <Avatar className="w-11 h-11">
                  <AvatarImage src={p.avatar_url ?? undefined} />
                  <AvatarFallback>{p.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-start">
                  <p className="text-sm font-medium truncate">{p.username}</p>
                  <p className="text-xs text-white/50 truncate">{p.display_name}</p>
                </div>
                <span
                  className={`w-5 h-5 rounded-full border grid place-items-center ${
                    isSel ? "bg-sky-500 border-sky-500" : "border-white/40"
                  }`}
                >
                  {isSel && <Check className="w-3 h-3" />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-3 border-t border-white/10 flex items-center gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("stories.writeAMessage")}
            className="flex-1 rounded-full bg-white/10 px-4 py-2 text-sm outline-none placeholder:text-white/40"
          />
          <button
            onClick={send}
            disabled={selected.size === 0 || sending}
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold flex items-center gap-1 disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send{selected.size > 0 ? ` (${selected.size})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
