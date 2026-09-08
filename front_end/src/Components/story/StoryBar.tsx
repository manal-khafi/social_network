import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { fetchStories, selectStoryGroups } from "../../features/stories/storiesSlice";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import StoryComposer from "./StoryComposer";

export default function StoryBar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const groups = useAppSelector(selectStoryGroups);
  const currentUser = useAppSelector((s) => s.user.currentUser);
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchStories());
  }, [dispatch]);

  const myGroup = groups.find((g) => g.user.id === currentUser?.id);
  const otherGroups = groups.filter((g) => g.user.id !== currentUser?.id);

  return (
    <div className="border-b border-border bg-card">
      <div className="p-4 flex gap-4 overflow-x-auto">
        {/* Your story */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <button
            onClick={() =>
              myGroup ? navigate(`/home/stories/${currentUser?.id}`) : setComposerOpen(true)
            }
            className="relative"
          >
            <div
              className={`p-0.5 rounded-full ${
                myGroup?.has_unseen
                  ? "bg-gradient-to-tr from-primary to-accent"
                  : "bg-muted"
              }`}
            >
              <Avatar className="w-16 h-16 border-2 border-card">
                <AvatarImage src={currentUser?.avatar_url ?? undefined} />
                <AvatarFallback>
                  {currentUser?.username?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
            </div>
            <span
              onClick={(e) => {
                e.stopPropagation();
                setComposerOpen(true);
              }}
              className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-card"
            >
              <Plus className="w-3 h-3 text-primary-foreground" />
            </span>
          </button>
          <span className="text-xs">Your story</span>
        </div>

        {/* Everyone else */}
        {otherGroups.map((group) => (
          <button
            key={group.user.id}
            onClick={() => navigate(`/home/stories/${group.user.id}`)}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <div
              className={`p-0.5 rounded-full ${
                group.has_unseen
                  ? "bg-gradient-to-tr from-primary to-accent"
                  : "bg-muted"
              }`}
            >
              <Avatar className="w-16 h-16 border-2 border-card">
                <AvatarImage src={group.user.avatar_url ?? undefined} />
                <AvatarFallback>{group.user.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs max-w-[64px] truncate">{group.user.username}</span>
          </button>
        ))}
      </div>

      <StoryComposer open={composerOpen} onClose={() => setComposerOpen(false)} />
    </div>
  );
}
