import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { openDirectByUserId, fetchConversations } from "../../features/messages/messagesSlice";
import { getFollowing, type StoryUser } from "../../api/storiesApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../Components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../../Components/ui/avatar";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewMessageDialog({ open, onOpenChange }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const meId = useAppSelector((s) => s.user.currentUser?.id ?? s.auth.user?.id);

  const [people, setPeople] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !meId) return;
    setLoading(true);
    getFollowing(meId)
      .then(setPeople)
      .catch(() => setPeople([]))
      .finally(() => setLoading(false));
  }, [open, meId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) => p.username.toLowerCase().includes(q) || p.display_name.toLowerCase().includes(q)
    );
  }, [people, query]);

  const start = async (userId: string) => {
    setBusy(userId);
    try {
      const convId = await dispatch(openDirectByUserId(userId)).unwrap();
      dispatch(fetchConversations());
      onOpenChange(false);
      navigate(`/home/inbox/${convId}`);
    } catch {
      toast.error("Couldn't start that chat");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-3 border-b border-border">
          <DialogTitle>New message</DialogTitle>
        </DialogHeader>

        <div className="p-3">
          <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people you follow"
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-2 pb-3">
          {loading ? (
            <div className="py-10 grid place-items-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              Follow people to message them.
            </p>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => start(p.id)}
                disabled={busy === p.id}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted disabled:opacity-50"
              >
                <Avatar className="w-11 h-11">
                  <AvatarImage src={p.avatar_url ?? undefined} />
                  <AvatarFallback>{p.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-medium truncate">{p.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.display_name}</p>
                </div>
                {busy === p.id && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
