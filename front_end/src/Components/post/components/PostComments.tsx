import type { Dispatch, SetStateAction } from "react";
import { useAppSelector } from "../../../hooks";
import type { Post, Comment } from "../../../features/posts/postsSlice";
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Separator } from "../../ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import CommentItem from "./CommentItem";
import { useTranslation } from "react-i18next";

interface PostCommentsProps {
  post: Post;
  postOwnerId: string;
  comments: Comment[];
  displayedComments: Comment[];
  hasMoreComments: boolean;
  showAllComments: boolean;
  setShowAllComments: Dispatch<SetStateAction<boolean>>;
  comment: string;
  setComment: Dispatch<SetStateAction<string>>;
  handleComment: () => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (open: boolean) => void;
}

/**
 * Comment thread of a post plus the "add a comment" input. The draft text and
 * the expanded state are owned by PostCard so they survive hiding the thread.
 */
export default function PostComments({
  post,
  postOwnerId,
  comments,
  displayedComments,
  hasMoreComments,
  showAllComments,
  setShowAllComments,
  comment,
  setComment,
  handleComment,
  showEmojiPicker,
  setShowEmojiPicker,
}: PostCommentsProps) {
  const { currentUser } = useAppSelector((state) => state.user);
  const authUser = useAppSelector((state) => state.auth.user);
  const { t } = useTranslation();

  return (
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
                ? t("posts.showLess")
                : t("posts.viewMoreComments", { count: comments.length - 2 })}
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
          placeholder={t("posts.addComment")}
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
          {t("posts.post")}
        </Button>
      </div>
    </>
  );
}
