import { useEffect, useState } from "react";
import { X, Eye, Loader2, Heart } from "lucide-react";
import {
  getStoryViews,
  getStoryReactions,
  type StoryViewEntry,
  type StoryReactionEntry,
} from "../../api/storiesApi";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface Props {
  storyId: string;
  viewCount: number;
  onClose: () => void;
}

export default function SeenBySheet({ storyId, viewCount, onClose }: Props) {
  const [views, setViews] = useState<StoryViewEntry[]>([]);
  const [reactionByUser, setReactionByUser] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStoryViews(storyId), getStoryReactions(storyId)])
      .then(([v, r]) => {
        setViews(v);
        setSummary(r.summary);
        const map: Record<string, string> = {};
        r.reactions.forEach((x: StoryReactionEntry) => {
          map[x.user.id] = x.emoji;
        });
        setReactionByUser(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storyId]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-neutral-900 text-white rounded-t-2xl max-h-[80%] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="font-semibold">{viewCount} views</span>
            {Object.entries(summary).map(([emoji, n]) => (
              <span key={emoji} className="text-sm text-white/70">
                {emoji} {n}
              </span>
            ))}
          </div>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading && (
            <div className="py-10 grid place-items-center">
              <Loader2 className="w-5 h-5 animate-spin text-white/50" />
            </div>
          )}
          {!loading && views.length === 0 && (
            <p className="text-center text-sm text-white/50 py-10">No views yet</p>
          )}
          {views.map((v) => (
            <div key={v.id} className="flex items-center gap-3 p-2">
              <Avatar className="w-10 h-10">
                <AvatarImage src={v.viewer.avatar_url ?? undefined} />
                <AvatarFallback>{v.viewer.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{v.viewer.username}</p>
                <p className="text-xs text-white/50 truncate">{v.viewer.display_name}</p>
              </div>
              {reactionByUser[v.viewer.id] ? (
                <span className="text-lg">{reactionByUser[v.viewer.id]}</span>
              ) : (
                <Heart className="w-4 h-4 text-white/20" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
