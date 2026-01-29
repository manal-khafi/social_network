import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks";
import {
  togglePostLike,
  togglePostSave,
  togglePostRepost,
  fetchComments,
  createComment,
  toggleCommentLike,
  archivePost,
  unarchivePost,
  deletePost,
  updateComment,
  deleteComment,
} from "../../features/posts/postsSlice";
import { blockUser } from "../../features/user/userSlice";
import { Card } from "../ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Heart,
  MessageCircle,
  Repeat,
  Bookmark,
  MoreVertical,
  Share,
  Ban,
  Flag,
  Archive,
  Smile,
  Edit,
  Trash2,
} from "lucide-react";
import type { Post, Comment } from "../../features/posts/postsSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import EmojiPicker from "emoji-picker-react";
import { toast } from "sonner";
import ShareDialog from "./ShareDialog";
import EditPostDialog from "./EditPostDialog";
import VideoPlayer from "./VideoPlayer";
import { formatTime } from "../../utils/timeUtils";
import { isVideoUrl } from "../../utils/mediaUtils";
import { PATHS } from "../../routes/paths";

interface PostCardProps {
  post: Post;
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  postOwnerId: string;
  isReply?: boolean;
  parentCommentId?: string;
  commentsAllowed: boolean;
}

function CommentItem({
  comment,
  postId,
  postOwnerId,
  isReply = false,
  parentCommentId,
  commentsAllowed,
}: CommentItemProps) {
  const dispatch = useAppDispatch();
  const { user: authUser } = useAppSelector((state) => state.auth);

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const currentUserId = authUser?.id;
  const isPostOwner = postOwnerId === currentUserId;
  const isMyComment = comment.userId === currentUserId;
  const canEdit = isMyComment;
  const canDelete = isMyComment || isPostOwner;

  const profilePath = isMyComment ? PATHS.PROFILE_ME : `/home/profile/${comment.userId}`;

  // keep edit text synced if comment updates from store
  useEffect(() => {
    setEditText(comment.content);
  }, [comment.content]);

  const handleLike = () => {
    dispatch(toggleCommentLike({ postId, commentId: comment.id }));
  };

  const handleReply = () => {
    if (!commentsAllowed) {
      toast.error("Comments are disabled for this post");
      return;
    }
    if (replyText.trim()) {
      dispatch(
        createComment({
          postId,
          content: replyText.trim(),
          parent_comment_id: parentCommentId || comment.id,
        })
      );
      setReplyText("");
      setShowReplyInput(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;

    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        await dispatch(deleteComment({ postId, commentId: comment.id })).unwrap();
      } catch (err) {
        toast.error(typeof err === "string" ? err : "Failed to delete comment");
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!canEdit) return;

    const next = editText.trim();
    if (!next) {
      toast.error("Comment can't be empty");
      return;
    }

    // if unchanged, just exit edit mode
    if (next === comment.content) {
      setIsEditing(false);
      return;
    }

    try {
      await dispatch(updateComment({ postId, commentId: comment.id, content: next })).unwrap();
      setIsEditing(false);
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to update comment");
    }
  };

  const handleCancelEdit = () => {
    setEditText(comment.content);
    setIsEditing(false);
  };

  return (
    <div className={isReply ? "ml-12" : ""}>
      <div className="flex gap-3 py-3">
        <Link to={profilePath}>
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.avatar} />
            <AvatarFallback>
              {((comment.username || "?")[0] || "?").toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div>
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />
              <div className="flex gap-2 mt-2">
                <Button onClick={handleSaveEdit} size="sm">
                  Save
                </Button>
                <Button onClick={handleCancelEdit} size="sm" variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-muted rounded-2xl px-3 py-2">
                <Link
                  to={profilePath}
                  className="font-semibold text-sm hover:underline"
                >
                  {comment.username}
                </Link>
                <p className="text-sm mt-0.5 break-words">{comment.content}</p>
              </div>

              <div className="flex items-center gap-4 mt-1 px-3">
                <span className="text-xs text-muted-foreground">
                  {formatTime(comment.timestamp)}
                </span>

                <button
                  onClick={handleLike}
                  className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
                >
                  {comment.isLiked ? "Liked" : "Like"}
                  {comment.likes > 0 && ` · ${comment.likes}`}
                </button>

                {commentsAllowed && (
                  <button
                    onClick={() => setShowReplyInput((v) => !v)}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Reply
                  </button>
                )}

                {canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Edit
                  </button>
                )}

                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </>
          )}

          {commentsAllowed && showReplyInput && !isEditing && (
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReply()}
                  placeholder={`Reply to ${comment.username}...`}
                  className="h-8 text-sm pr-10"
                  autoFocus
                />

                <Popover>
                  <PopoverTrigger asChild>
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full">
                      <Smile className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-0" align="end" side="top">
                    <EmojiPicker
                      onEmojiClick={(emojiData) =>
                        setReplyText((prev) => prev + emojiData.emoji)
                      }
                      width={350}
                      height={400}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                onClick={handleReply}
                size="sm"
                className="bg-[#d6955b] hover:bg-[#c58549] h-8"
              >
                Reply
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-0">
          {comment.replies.map((reply: Comment) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              postOwnerId={postOwnerId}
              isReply
              parentCommentId={comment.id}
              commentsAllowed={commentsAllowed}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostCard({ post }: PostCardProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { currentUser } = useAppSelector((state) => state.user);
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
  const [showComments, setShowComments] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleToggleComments = () => {
    if (!post.commentsAllowed) return;
    setShowComments((v) => !v);
  };

  const handleComment = async () => {
    if (!post.commentsAllowed) {
      toast.error("Comments are disabled for this post");
      return;
    }
    const text = comment.trim();
    if (!text) return;

    try {
      await dispatch(createComment({ postId: post.id, content: text })).unwrap();
      setComment("");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to create comment");
    }
  };

  const handleRepost = () => {
    dispatch(togglePostRepost(post.id));
    toast.success(post.isReposted ? "Repost removed" : "Post reposted!");
  };

  const handleSave = () => {
    dispatch(togglePostSave(post.id));
    toast.success(post.isSaved ? "Post unsaved!" : "Post saved!");
  };

  const handleBlock = async () => {
    if (confirm(`Block @${post.username}?`)) {
      try {
        await dispatch(blockUser(post.userId)).unwrap();
        toast.success(`Blocked @${post.username}`);

        if (location.pathname === `/profile/${post.userId}`) {
          navigate("/");
        }
      } catch (error) {
        toast.error("Failed to block user");
        console.error("Error blocking user:", error);
      }
    }
  };

  const handleReport = () => {
    toast.success("Post reported. We'll review it shortly.");
  };

  const handleArchive = () => {
    dispatch(archivePost(post.id));
    toast.success("Post archived");
  };

  const handleUnarchive = () => {
    dispatch(unarchivePost(post.id));
    toast.success("Post unarchived");
  };

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone."))
      return;

    try {
      await dispatch(deletePost(post.id)).unwrap();
      toast.success("Post deleted successfully");
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
          : "Failed to delete post";
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
        <div className="flex items-start gap-3 mb-3">
          <Link to={profilePath}>
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.avatar} />
              <AvatarFallback>
                {((post.username || "?")[0] || "?").toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link to={profilePath} className="hover:underline">
                  <p className="font-semibold">{post.username}</p>
                </Link>

                {post.isEdited && (
                  <span className="text-xs text-muted-foreground italic">EDITED</span>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 hover:bg-muted rounded-full">
                    <MoreVertical className="w-5 h-5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  {isOwnPost ? (
                    <>
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Post
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={handleDeletePost} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Post
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={handleSave}>
                        <Bookmark className="w-4 h-4 mr-2" />
                        {post.isSaved ? "Unsave" : "Save"} Post
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={handleRepost}>
                        <Repeat className="w-4 h-4 mr-2" />
                        Repost
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {post.isArchived ? (
                        <DropdownMenuItem onClick={handleUnarchive}>
                          <Archive className="w-4 h-4 mr-2" />
                          Unarchive Post
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={handleArchive}>
                          <Archive className="w-4 h-4 mr-2" />
                          Archive Post
                        </DropdownMenuItem>
                      )}
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={handleBlock}>
                        <Ban className="w-4 h-4 mr-2" />
                        Block @{post.username}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={handleRepost}>
                        <Repeat className="w-4 h-4 mr-2" />
                        Repost
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={handleSave}>
                        <Bookmark className="w-4 h-4 mr-2" />
                        {post.isSaved ? "Unsave" : "Save"} Post
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={handleReport} className="text-destructive">
                        <Flag className="w-4 h-4 mr-2" />
                        Report Post
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="text-sm text-muted-foreground">{formatTime(post.timestamp)}</p>
          </div>
        </div>

        {/* Repost indicator */}
        {post.originalPost && (
          <div className="mb-2 text-sm text-muted-foreground flex items-center gap-1">
            <Repeat className="w-4 h-4" />
            Reposted from @{post.originalPost.username}
          </div>
        )}

        {/* Post Content */}
        <p className="mb-3 whitespace-pre-wrap text-[15px] leading-6">{post.content}</p>

        {/* Post Media */}
        {media.length > 0 && (
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
                      alt="Post content"
                      className={`w-full object-cover rounded-lg ${
                        media.length > 1 ? "h-48" : "max-h-96"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center justify-between text-muted-foreground mb-3">
          <button
            onClick={() => dispatch(togglePostLike(post.id))}
            className="flex items-center gap-2 hover:text-red-500 transition-colors"
          >
            <Heart className={`w-5 h-5 ${post.isLiked ? "fill-red-500 text-red-500" : ""}`} />
            {post.likesVisible && <span className="text-sm">{post.likes}</span>}
          </button>

          {/* Hide comment button if comments are disabled */}
          {post.commentsAllowed && (
            <button
              onClick={handleToggleComments}
              className="flex items-center gap-2 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{post.comments}</span>
            </button>
          )}

          <button
            onClick={() => dispatch(togglePostRepost(post.id))}
            className="flex items-center gap-2 hover:text-green-500 transition-colors"
          >
            <Repeat className={`w-5 h-5 ${post.isReposted ? "text-green-500" : ""}`} />
            <span className="text-sm">{post.shares}</span>
          </button>

          <button
            onClick={() => setShowShareDialog(true)}
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <Share className="w-5 h-5" />
          </button>

          <button
            onClick={() => dispatch(togglePostSave(post.id))}
            className="hover:text-primary transition-colors"
          >
            <Bookmark className={`w-5 h-5 ${post.isSaved ? "fill-current text-primary" : ""}`} />
          </button>
        </div>

        {/* Comments Section */}
        {post.commentsAllowed && showComments && (
          <>
            {comments.length > 0 && (
              <>
                <Separator className="my-3" />
                <div className="space-y-0">
                  {displayedComments.map((commentItem) => (
                    <CommentItem
                      key={commentItem.id}
                      comment={commentItem}
                      postId={post.id}
                      postOwnerId={postOwnerId}
                      commentsAllowed={post.commentsAllowed}
                    />
                  ))}
                </div>

                {hasMoreComments && (
                  <button
                    onClick={() => setShowAllComments((v) => !v)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-2 px-3"
                  >
                    {showAllComments
                      ? "Show less"
                      : `View ${comments.length - 2} more comment${
                          comments.length - 2 > 1 ? "s" : ""
                        }`}
                  </button>
                )}

                <Separator className="my-3" />
              </>
            )}

            {/* Add Comment Input */}
            <div className="flex gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentUser?.avatar_url ?? authUser?.avatar ?? undefined} />
                <AvatarFallback>
                  {((currentUser?.username || authUser?.username || "?")[0] || "?").toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <Input
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                className="flex-1"
              />

              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger>
                  <Smile className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </PopoverTrigger>
                <PopoverContent className="w-60">
                  <EmojiPicker
                    onEmojiClick={(emoji) => setComment((prev) => prev + emoji.emoji)}
                    previewConfig={{ showPreview: false }}
                  />
                </PopoverContent>
              </Popover>

              <Button
                onClick={handleComment}
                size="sm"
                className="bg-[#d6955b] hover:bg-[#c58549]"
                disabled={!comment.trim()}
              >
                Post
              </Button>
            </div>
          </>
        )}
      </div>

      <ShareDialog postId={post.id} open={showShareDialog} onOpenChange={setShowShareDialog} />
      <EditPostDialog post={post} open={showEditDialog} onOpenChange={setShowEditDialog} />
    </Card>
  );
}
