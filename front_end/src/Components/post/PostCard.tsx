import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks";
import {
  togglePostLike,
  togglePostSave,
  togglePostRepost,
  fetchComments,
  createComment,
  archivePost,
  unarchivePost,
  deletePost,
} from "../../features/posts/postsSlice";
import { blockUser } from "../../features/user/userSlice";
import { Card } from "../ui/card";
import { Repeat } from "lucide-react";
import type { Post } from "../../features/posts/postsSlice";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import ShareDialog from "./ShareDialog";
import EditPostDialog from "./EditPostDialog";
import ReportPostDialog from "./ReportPostDialog";
import PostHeader from "./components/PostHeader";
import PostMedia from "./components/PostMedia";
import PostActions from "./components/PostActions";
import PostComments from "./components/PostComments";
import { PATHS } from "../../routes/paths";
import { renderMentionText } from "../../utils/mentionUtils";

interface PostCardProps {
  post: Post;
  /** Show the comment thread straight away (post opened from a comment / mention notification). */
  initiallyShowComments?: boolean;
}

export default function PostCard({ post, initiallyShowComments = false }: PostCardProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const authUser = useAppSelector((state) => state.auth.user);
  const isOwnPost = authUser?.id === post.userId;
  const profilePath = isOwnPost
    ? PATHS.PROFILE_ME
    : `/home/profile/${encodeURIComponent(post.username || post.userId)}`;

  // ✅ simplest + always correct (no need to store postOwnerId in redux)
  const postOwnerId = post.userId;

  const comments = useAppSelector(
    (state) => state.posts.postComments[post.id]?.comments || []
  );

  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(initiallyShowComments);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleToggleComments = () => {
    if (!post.commentsAllowed) return;
    setShowComments((v) => !v);
  };

  const handleComment = async () => {
    if (!post.commentsAllowed) {
      toast.error(t("posts.commentsDisabled"));
      return;
    }
    const text = comment.trim();
    if (!text) return;

    try {
      await dispatch(createComment({ postId: post.id, content: text })).unwrap();
      setComment("");
    } catch (err) {
      toast.error(typeof err === "string" ? err : t("posts.commentCreateFailed"));
    }
  };

  const handleRepost = () => {
    dispatch(togglePostRepost(post.id));
    toast.success(post.isReposted ? t("posts.repostRemoved") : t("posts.reposted"));
  };

  const handleSave = () => {
    dispatch(togglePostSave(post.id));
    toast.success(post.isSaved ? t("posts.unsaved") : t("posts.saved"));
  };

  const handleBlock = async () => {
    if (confirm(t("posts.blockConfirm", { username: post.username }))) {
      try {
        await dispatch(blockUser(post.userId)).unwrap();
        toast.success(t("posts.blocked", { username: post.username }));

        if (location.pathname.startsWith("/home/profile/")) {
          navigate("/home/feed");
        }
      } catch (error) {
        toast.error(t("posts.blockFailed"));
        console.error("Error blocking user:", error);
      }
    }
  };

  const handleReport = () => {
    setShowReportDialog(true);
  };

  const handleArchive = () => {
    dispatch(archivePost(post.id));
    toast.success(t("posts.archived"));
  };

  const handleUnarchive = () => {
    dispatch(unarchivePost(post.id));
    toast.success(t("posts.unarchived"));
  };

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleDeletePost = async () => {
    try {
      await dispatch(deletePost(post.id)).unwrap();
      toast.success(t("posts.deleted"));
    } catch (error: unknown) {
      const message =
        (error &&
          typeof error === "object" &&
          "response" in error &&
          (error as any).response &&
          typeof (error as any).response === "object" &&
          "data" in (error as any).response &&
          (error as any).response.data &&
          typeof (error as any).response.data === "object" &&
          "message" in (error as any).response.data)
          ? String((error as any).response.data.message)
          : t("posts.deleteFailed");
      toast.error(message);
    }
  };

  const displayedComments = showAllComments ? comments : comments.slice(0, 2);
  const hasMoreComments = comments.length > 2;
  const media = post.images ?? [];

  const handleDoubleTapLike = () => {
    if (!post.isLiked) {
      dispatch(togglePostLike(post.id));
    }
  };

  useEffect(() => {
    if (showComments && post.commentsAllowed) {
      dispatch(fetchComments(post.id));
    }
  }, [dispatch, post.id, showComments, post.commentsAllowed]);

  return (
    <Card className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="p-5">
        {/* Post Header */}
        <PostHeader
          post={post}
          profilePath={profilePath}
          isOwnPost={isOwnPost}
          handleEdit={handleEdit}
          handleDeletePost={handleDeletePost}
          handleSave={handleSave}
          handleRepost={handleRepost}
          handleArchive={handleArchive}
          handleUnarchive={handleUnarchive}
          handleBlock={handleBlock}
          handleReport={handleReport}
        />

        {/* Repost indicator */}
        {post.originalPost && (
          <div className="mb-2 text-sm text-muted-foreground flex items-center gap-1 min-w-0 break-all">
            <Repeat className="w-4 h-4" />
            {t("posts.repostedFrom", { username: post.originalPost.username })}
          </div>
        )}

        {/* Post Content */}
        <p className="mb-3 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[15px] leading-6">{renderMentionText(post.content)}</p>

        {/* Post Media */}
        <PostMedia post={post} media={media} handleDoubleTapLike={handleDoubleTapLike} />

        {/* Post Actions */}
        <PostActions
          post={post}
          handleToggleComments={handleToggleComments}
          setShowShareDialog={setShowShareDialog}
        />

        {/* Comments Section */}
        {post.commentsAllowed && showComments && (
          <PostComments
            post={post}
            postOwnerId={postOwnerId}
            comments={comments}
            displayedComments={displayedComments}
            hasMoreComments={hasMoreComments}
            showAllComments={showAllComments}
            setShowAllComments={setShowAllComments}
            comment={comment}
            setComment={setComment}
            handleComment={handleComment}
            showEmojiPicker={showEmojiPicker}
            setShowEmojiPicker={setShowEmojiPicker}
          />
        )}
      </div>

      <ShareDialog post={post} open={showShareDialog} onOpenChange={setShowShareDialog} />
      <EditPostDialog post={post} open={showEditDialog} onOpenChange={setShowEditDialog} />
      <ReportPostDialog
        postId={post.id}
        reportedUserId={post.userId}
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
      />
    </Card>
  );
}
