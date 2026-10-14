import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import {
  createComment,
  toggleCommentLike,
  updateComment,
  deleteComment,
} from "../../../features/posts/postsSlice";
import type { Comment } from "../../../features/posts/postsSlice";
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { toast } from "sonner";
import { formatTime } from "../../../utils/timeUtils";
import { useTimeTicker } from "../../../hooks/useTimeTicker";
import { PATHS } from "../../../routes/paths";
import { useTranslation } from "react-i18next";

interface CommentItemProps {
  comment: Comment;
  postId: string;
  postOwnerId: string;
  isReply?: boolean;
  parentCommentId?: string;
  commentsAllowed: boolean;
}

export default function CommentItem({
  comment,
  postId,
  postOwnerId,
  isReply = false,
  parentCommentId,
  commentsAllowed,
}: CommentItemProps) {
  useTimeTicker();
  const { t } = useTranslation();
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
      toast.error(t("posts.commentsDisabled"));
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

    if (window.confirm(t("posts.deleteCommentConfirm"))) {
      try {
        await dispatch(deleteComment({ postId, commentId: comment.id })).unwrap();
      } catch (err) {
        toast.error(typeof err === "string" ? err : t("posts.commentDeleteFailed"));
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!canEdit) return;

    const next = editText.trim();
    if (!next) {
      toast.error(t("posts.commentEmpty"));
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
      toast.error(typeof err === "string" ? err : t("posts.commentUpdateFailed"));
    }
  };

  const handleCancelEdit = () => {
    setEditText(comment.content);
    setIsEditing(false);
  };

  return (
    <div className={isReply ? "ms-12" : ""}>
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
                  {t("actions.save")}
                </Button>
                <Button onClick={handleCancelEdit} size="sm" variant="outline">
                  {t("actions.cancel")}
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
                  {comment.isLiked ? t("posts.liked") : t("posts.like")}
                  {comment.likes > 0 && ` · ${comment.likes}`}
                </button>

                {commentsAllowed && (
                  <button
                    onClick={() => setShowReplyInput((v) => !v)}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t("posts.reply")}
                  </button>
                )}

                {canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t("actions.edit")}
                  </button>
                )}

                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    {t("actions.delete")}
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
                  placeholder={t("posts.replyTo", { username: comment.username })}
                  className="h-8 text-sm pe-10"
                  autoFocus
                />

                <Popover>
                  <PopoverTrigger asChild>
                    <button className="absolute end-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full">
                      <Smile className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-0" align="end" side="top">
                    <EmojiPicker
                      onEmojiClick={(emojiData) =>
                        setReplyText((prev) => prev + emojiData.emoji)
                      }
                      width="min(350px, calc(100vw - 24px))"
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
                {t("posts.reply")}
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
