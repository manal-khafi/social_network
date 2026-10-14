import { Loader2, Star } from "lucide-react";
import type { StoryVisibility } from "../../../api/storiesApi";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { useAppSelector } from "../../../hooks";
import { selectMyAvatar } from "../../../features/user/userSlice";
import { useTranslation } from "react-i18next";

interface StoryShareBarProps {
  share: (visibility: StoryVisibility) => void;
  canShare: boolean;
  /** Audience being posted to, while a post is in flight. */
  posting: StoryVisibility | null;
}

/** Bottom bar (Instagram style): post to "Your story" or to "Close friends". */
export default function StoryShareBar({ share, canShare, posting }: StoryShareBarProps) {
  const { t } = useTranslation();
  const avatar = useAppSelector(selectMyAvatar);
  const username = useAppSelector((s) => s.user.currentUser?.username ?? s.auth.user?.username ?? "");
  const busy = posting !== null;

  return (
    <div className="flex items-center gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <button
        onClick={() => share("public")}
        disabled={!canShare || busy}
        className="flex-1 min-w-0 flex items-center justify-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-2.5 text-sm font-semibold disabled:opacity-50"
      >
        {posting === "public" ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Avatar className="w-6 h-6 shrink-0">
            <AvatarImage src={avatar} />
            <AvatarFallback className="text-[10px] text-black">{username[0]?.toUpperCase() ?? "?"}</AvatarFallback>
          </Avatar>
        )}
        <span className="truncate">{t("stories.yourStory")}</span>
      </button>

      <button
        onClick={() => share("close_friends")}
        disabled={!canShare || busy}
        className="flex-1 min-w-0 flex items-center justify-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-2.5 text-sm font-semibold disabled:opacity-50"
      >
        {posting === "close_friends" ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <span className="grid place-items-center w-6 h-6 shrink-0 rounded-full bg-green-500">
            <Star className="w-3.5 h-3.5 fill-white text-white" />
          </span>
        )}
        <span className="truncate">{t("stories.visibility.closeFriends")}</span>
      </button>
    </div>
  );
}
