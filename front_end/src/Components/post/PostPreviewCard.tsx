import type { StoryUser } from "../../api/storiesApi";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const VIDEO_URL = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

/** First image / video of a post's media list (media_urls is JSON from the API). */
export const firstPostMedia = (media: unknown): { url: string; video: boolean } | null => {
  const url = Array.isArray(media) ? media.find((m): m is string => typeof m === "string" && !!m) : null;
  return url ? { url, video: VIDEO_URL.test(url) } : null;
};

interface Props {
  user: StoryUser;
  content: string | null;
  media: unknown;
  /** "story": white card on the story canvas; "chat": card inside a message bubble. */
  variant?: "story" | "chat";
  className?: string;
}

/**
 * A post shown as an embedded card: author, first image / video, text.
 * Used for posts reshared to a story and posts sent in a DM.
 */
export default function PostPreviewCard({ user, content, media, variant = "story", className = "" }: Props) {
  const first = firstPostMedia(media);
  const surface =
    variant === "story"
      ? "bg-white/95 text-black shadow-xl"
      : "bg-background text-foreground border border-border";

  return (
    <div className={`rounded-xl overflow-hidden text-start ${surface} ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2">
        <Avatar className="w-6 h-6">
          <AvatarImage src={user.avatar_url ?? undefined} />
          <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="text-xs font-semibold truncate">@{user.username}</span>
      </div>
      {first &&
        (first.video ? (
          <video src={first.url} className="w-full max-h-72 object-cover bg-black" muted playsInline preload="metadata" />
        ) : (
          <img src={first.url} alt="" className="w-full max-h-72 object-cover" />
        ))}
      {content && <p className="px-3 py-2 text-sm line-clamp-4 whitespace-pre-wrap break-words">{content}</p>}
    </div>
  );
}
