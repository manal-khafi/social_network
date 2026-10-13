import VideoPlayer from "../VideoPlayer";
import { isVideoUrl } from "../../../utils/mediaUtils";
import type { Post } from "../../../features/posts/postsSlice";
import { useTranslation } from "react-i18next";

interface PostMediaProps {
  post: Post;
  media: string[];
  handleDoubleTapLike: () => void;
}

/** Images and videos attached to a post (grid when there is more than one). */
export default function PostMedia({ post, media, handleDoubleTapLike }: PostMediaProps) {
  const { t } = useTranslation();
  if (media.length === 0) return null;

  return (
    <div className="mb-3">
      <div className={media.length > 1 ? "grid grid-cols-2 gap-2" : ""}>
        {media.map((item, index) => (
          <div key={`${post.id}-media-${index}`}>
            {isVideoUrl(item) ? (
              <VideoPlayer
                src={item}
                onDoubleTapLike={handleDoubleTapLike}
                className={media.length > 1 ? "h-48" : ""}
              />
            ) : (
              <img
                src={item}
                alt={t("posts.mediaAlt")}
                className={`w-full object-cover rounded-lg ${
                  media.length > 1 ? "h-48" : "max-h-96"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
