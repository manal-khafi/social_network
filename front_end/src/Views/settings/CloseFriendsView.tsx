import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "../../hooks";
import { Avatar, AvatarFallback, AvatarImage } from "../../Components/ui/avatar";
import { getFollowing, type StoryUser } from "../../api/storiesApi";
import {
  getCloseFriends,
  addCloseFriend,
  removeCloseFriend,
} from "../../api/closeFriendsApi";

export default function CloseFriendsView() {
  const navigate = useNavigate();
  const currentUser = useAppSelector((s) => s.user.currentUser);

  const [people, setPeople] = useState<StoryUser[]>([]);
  const [closeIds, setCloseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    Promise.all([getFollowing(currentUser.id), getCloseFriends()])
      .then(([following, close]) => {
        const closeSet = new Set(close.map((c) => c.id));
        setCloseIds(closeSet);
        // union of people you follow + anyone already on the list
        const byId = new Map<string, StoryUser>();
        [...following, ...close].forEach((u) => byId.set(u.id, u));
        setPeople([...byId.values()]);
      })
      .catch(() => toast.error("Could not load your contacts"))
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? people.filter(
          (p) =>
            p.username.toLowerCase().includes(q) ||
            p.display_name.toLowerCase().includes(q)
        )
      : people;
    return [...list].sort((a, b) => {
      const ac = closeIds.has(a.id) ? 0 : 1;
      const bc = closeIds.has(b.id) ? 0 : 1;
      return ac - bc || a.username.localeCompare(b.username);
    });
  }, [people, query, closeIds]);

  const toggle = async (user: StoryUser) => {
    const isClose = closeIds.has(user.id);
    setBusy(user.id);
    // optimistic
    setCloseIds((prev) => {
      const next = new Set(prev);
      isClose ? next.delete(user.id) : next.add(user.id);
      return next;
    });
    try {
      if (isClose) await removeCloseFriend(user.id);
      else await addCloseFriend(user.id);
    } catch {
      toast.error("Update failed");
      setCloseIds((prev) => {
        const next = new Set(prev);
        isClose ? next.add(user.id) : next.delete(user.id);
        return next;
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto p-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold">Close Friends</h1>
            <p className="text-xs text-muted-foreground">
              {closeIds.size} {closeIds.size === 1 ? "person" : "people"} · only they see
              close-friends stories
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-24">
        <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 mb-3">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people you follow"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        {loading ? (
          <div className="py-16 grid place-items-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-16">
            No one to show. Follow people first.
          </p>
        ) : (
          <ul className="space-y-1">
            {filtered.map((p) => {
              const isClose = closeIds.has(p.id);
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                >
                  <Avatar className="w-11 h-11">
                    <AvatarImage src={p.avatar_url ?? undefined} />
                    <AvatarFallback>{p.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.username}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.display_name}
                    </p>
                  </div>
                  <button
                    onClick={() => toggle(p)}
                    disabled={busy === p.id}
                    aria-pressed={isClose}
                    aria-label={isClose ? "Remove from close friends" : "Add to close friends"}
                    className="p-2 disabled:opacity-50"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        isClose
                          ? "fill-green-500 text-green-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
