import { useEffect, useState } from "react";
import { X, Search, Loader2, AtSign } from "lucide-react";
import { searchAccounts, type StoryUser } from "../../api/storiesApi";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface Props {
  onPick: (username: string) => void;
  onClose: () => void;
}

export default function MentionPicker({ onPick, onClose }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        setResults(await searchAccounts(term));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="absolute inset-0 z-40 bg-black/95 flex flex-col">
      <div className="flex items-center gap-2 p-3 border-b border-white/10 text-white">
        <button onClick={onClose} aria-label="Close"><X className="w-6 h-6" /></button>
        <AtSign className="w-4 h-4" />
        <span className="font-semibold">Mention someone</span>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-white">
          <Search className="w-4 h-4 text-white/50" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search accounts"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/40"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-white/50" />}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-6">
        {results.map((u) => (
          <button
            key={u.id}
            onClick={() => onPick(u.username)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-white"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={u.avatar_url ?? undefined} />
              <AvatarFallback>{u.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium truncate">{u.username}</p>
              <p className="text-xs text-white/50 truncate">{u.display_name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
