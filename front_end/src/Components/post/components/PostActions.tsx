import { useAppDispatch } from "../../../hooks";
import {
  togglePostLike,
  togglePostSave,
  togglePostRepost,
} from "../../../features/posts/postsSlice";
import type { Post } from "../../../features/posts/postsSlice";
import { Heart, MessageCircle, Repeat, Bookmark, Share } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PostActionsProps {
  post: Post;
  handleToggleComments: () => void;
  setShowShareDialog: (open: boolean) => void;
}

/** Like, comment, repost, share and save buttons with their counters. */
export default function PostActions({
  post,
  handleToggleComments,
  setShowShareDialog,
}: PostActionsProps) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between text-muted-foreground mb-3">
      <button
        onClick={() => dispatch(togglePostLike(post.id))}
        className="flex items-center gap-2 hover:text-red-500 transition-colors"
        aria-label={post.isLiked ? t("posts.unlike") : t("posts.like")}
      >
        <Heart className={`w-5 h-5 ${post.isLiked ? "fill-red-500 text-red-500" : ""}`} />
        {post.likesVisible && <span className="text-sm">{post.likes}</span>}
      </button>

      {/* Hide comment button if comments are disabled */}
      {post.commentsAllowed && (
        <button
          onClick={handleToggleComments}
          className="flex items-center gap-2 hover:text-blue-500 transition-colors"
          aria-label={t("posts.comment")}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{post.comments}</span>
        </button>
      )}

      <button
        onClick={() => dispatch(togglePostRepost(post.id))}
        className="flex items-center gap-2 hover:text-green-500 transition-colors"
        aria-label={t("posts.repost")}
      >
        <Repeat className={`w-5 h-5 ${post.isReposted ? "text-green-500" : ""}`} />
        <span className="text-sm">{post.shares}</span>
      </button>

      <button
        onClick={() => setShowShareDialog(true)}
        className="flex items-center gap-2 hover:text-primary transition-colors"
        aria-label={t("posts.share")}
      >
        <Share className="w-5 h-5" />
      </button>

      <button
        onClick={() => dispatch(togglePostSave(post.id))}
        className="hover:text-primary transition-colors"
        aria-label={post.isSaved ? t("posts.unsave") : t("posts.save")}
      >
        <Bookmark className={`w-5 h-5 ${post.isSaved ? "fill-current text-primary" : ""}`} />
      </button>
    </div>
  );
}
