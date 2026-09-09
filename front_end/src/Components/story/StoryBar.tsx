import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { fetchStories, selectStoryGroups } from "../../features/stories/storiesSlice";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import StoryComposer from "./StoryComposer";

const RING_UNSEEN =
  "bg-[conic-gradient(from_180deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888,#f09433)]";

function Ring({
  src,
  fallback,
  unseen,
  dim,
}: {
  src?: string | null;
  fallback: string;
  unseen: boolean;
  dim?: boolean;
}) {
  return (
    <span
      className={`inline-flex rounded-full p-[2.5px] ${
        unseen ? RING_UNSEEN : "bg-border"
      } ${dim ? "opacity-90" : ""}`}
    >
      <span className="rounded-full p-[2px] bg-card">
        <Avatar className="w-[64px] h-[64px]">
          <AvatarImage src={src ?? undefined} />
          <AvatarFallback className="text-lg">{fallback}</AvatarFallback>
        </Avatar>
      </span>
    </span>
  );
}

export default function StoryBar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const groups = useAppSelector(selectStoryGroups);
  const status = useAppSelector((s) => s.stories.status);
  const currentUser = useAppSelector((s) => s.user.currentUser);
  const authUser = useAppSelector((s) => s.auth.user);
  const meId = currentUser?.id ?? authUser?.id;
  const meName = currentUser?.username ?? authUser?.username;
  const meAvatar = currentUser?.avatar_url ?? undefined;
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchStories());
  }, [dispatch]);

  const myGroup = groups.find((g) => g.user.id === meId);
  const otherGroups = groups.filter((g) => g.user.id !== meId);
  const loading = status === "loading" && groups.length === 0;

  return (
    <div className="border-b border-border bg-card">
      <div className="flex gap-4 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Your story */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[76px]">
          <button
            onClick={() =>
              myGroup ? navigate(`/home/stories/${meId}`) : setComposerOpen(true)
            }
            className="relative active:scale-95 transition-transform"
            aria-label={myGroup ? "View your story" : "Add to your story"}
          >
            {myGroup ? (
              <Ring
                src={meAvatar}
                fallback={meName?.[0]?.toUpperCase() ?? "?"}
                unseen={myGroup.has_unseen}
              />
            ) : (
              <span className="inline-flex rounded-full p-[2.5px] bg-border">
                <span className="rounded-full p-[2px] bg-card">
                  <Avatar className="w-[64px] h-[64px]">
                    <AvatarImage src={meAvatar} />
                    <AvatarFallback className="text-lg">
                      {meName?.[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                </span>
              </span>
            )}
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setComposerOpen(true);
              }}
              className="absolute bottom-0.5 right-0.5 w-6 h-6 bg-primary rounded-full grid place-items-center border-[3px] border-card shadow"
            >
              <Plus className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
            </span>
          </button>
          <span className="text-[11px] text-muted-foreground truncate max-w-full">Your story</span>
        </div>

        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[76px]">
              <div className="w-[71px] h-[71px] rounded-full bg-muted animate-pulse" />
              <div className="h-2.5 w-12 rounded bg-muted animate-pulse" />
            </div>
          ))}

        {/* Everyone else */}
        {otherGroups.map((group) => (
          <button
            key={group.user.id}
            onClick={() => navigate(`/home/stories/${group.user.id}`)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[76px] active:scale-95 transition-transform"
          >
            <Ring
              src={group.user.avatar_url}
              fallback={group.user.username[0]?.toUpperCase() ?? "?"}
              unseen={group.has_unseen}
              dim={!group.has_unseen}
            />
            <span
              className={`text-[11px] truncate max-w-full ${
                group.has_unseen ? "font-medium" : "text-muted-foreground"
              }`}
            >
              {group.user.username}
            </span>
          </button>
        ))}
      </div>

      <StoryComposer open={composerOpen} onClose={() => setComposerOpen(false)} />
    </div>
  );
}
