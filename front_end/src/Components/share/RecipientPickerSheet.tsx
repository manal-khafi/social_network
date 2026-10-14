import { useEffect, useMemo, useState } from "react";
import { X, Search, Send, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "../../hooks";
import { getFollowing, searchAccounts, type StoryUser } from "../../api/storiesApi";
import { listConversations } from "../../api/messagesApi";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useTranslation } from "react-i18next";

interface Props {
  /** Sends to the picked people; resolves with how many actually received it. */
  onSend: (recipientIds: string[], note: string | undefined) => Promise<number>;
  onClose: () => void;
  /**
   * "absolute": fills the positioned parent (story viewer);
   * "fixed": a sheet over the whole page (post share).
   */
  position?: "absolute" | "fixed";
}

/**
 * "Send to" sheet: recent chats, people you follow, and account search; pick
 * people, add an optional note, send. Used to share stories and posts by DM.
 */
export default function RecipientPickerSheet({ onSend, onClose, position = "absolute" }: Props) {
  const { t } = useTranslation();
  // The signed-in user comes from the session; state.user.currentUser is only
  // loaded once the profile screen has been opened.
  const myId = useAppSelector((s) => s.auth.user?.id ?? s.user.currentUser?.id ?? null);
  const [people, setPeople] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StoryUser[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Map<string, StoryUser>>(new Map());
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  // Suggestions: recent chats first, then the people you follow.
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([listConversations(), myId ? getFollowing(myId) : Promise.resolve([])]).then(
      ([chats, following]) => {
        if (cancelled) return;
        const seen = new Set<string>();
        const list: StoryUser[] = [];
        const add = (u: StoryUser | null | undefined) => {
          if (!u?.id || u.id === myId || seen.has(u.id)) return;
          seen.add(u.id);
          list.push(u);
        };
        if (chats.status === "fulfilled") chats.value.filter((c) => !c.is_group).forEach((c) => add(c.other_user));
        if (following.status === "fulfilled") following.value.forEach(add);
        setPeople(list);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [myId]);

  // Typing searches every account, like the new-message screen.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      searchAccounts(q)
        .then((users) => !cancelled && setResults(users.filter((u) => u.id !== myId)))
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setSearching(false));
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, myId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    // Matching suggestions right away, then the server results.
    const local = people.filter(
      (p) => p.username.toLowerCase().includes(q) || p.display_name?.toLowerCase().includes(q)
    );
    const ids = new Set(local.map((p) => p.id));
    return [...local, ...(results ?? []).filter((u) => !ids.has(u.id))];
  }, [people, query, results]);

  const toggle = (user: StoryUser) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(user.id)) next.delete(user.id);
      else next.set(user.id, user);
      return next;
    });

  const send = async () => {
    if (selected.size === 0 || sending) return;
    setSending(true);
    try {
      const sent = await onSend([...selected.keys()], note.trim() || undefined);
      toast.success(t("stories.sentToCount", { count: sent }));
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("stories.couldNotSend"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={`${position === "fixed" ? "fixed z-[60]" : "absolute z-50"} inset-0 flex flex-col justify-end`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-neutral-900 text-white rounded-t-2xl max-h-[80%] w-full max-w-lg mx-auto flex flex-col"
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
          {(loading || (searching && filtered.length === 0)) && (
            <div className="py-10 grid place-items-center">
              <Loader2 className="w-5 h-5 animate-spin text-white/50" />
            </div>
          )}
          {!loading && !searching && filtered.length === 0 && (
            <p className="text-center text-sm text-white/50 py-10">
              {query.trim() ? t("stories.noResults") : t("stories.noOneToSendToYet")}
            </p>
          )}
          {filtered.map((p) => {
            const isSel = selected.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p)}
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
            {t("actions.send")}{selected.size > 0 ? ` (${selected.size})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
