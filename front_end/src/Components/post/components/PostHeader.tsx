import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../../ui/dropdown-menu";
import { Repeat, Bookmark, MoreVertical, Ban, Flag, Archive, Edit, Trash2 } from "lucide-react";
import type { Post } from "../../../features/posts/postsSlice";
import { formatTime } from "../../../utils/timeUtils";
import { useTimeTicker } from "../../../hooks/useTimeTicker";

interface PostHeaderProps {
  post: Post;
  profilePath: string;
  isOwnPost: boolean;
  handleEdit: () => void;
  handleDeletePost: () => void;
  handleSave: () => void;
  handleRepost: () => void;
  handleArchive: () => void;
  handleUnarchive: () => void;
  handleBlock: () => void;
  handleReport: () => void;
}

/** Author avatar, name, timestamp and the "more" menu (edit, delete, save, block, report, ...). */
export default function PostHeader({
  post,
  profilePath,
  isOwnPost,
  handleEdit,
  handleDeletePost,
  handleSave,
  handleRepost,
  handleArchive,
  handleUnarchive,
  handleBlock,
  handleReport,
}: PostHeaderProps) {
  useTimeTicker();

  return (
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
  );
}
