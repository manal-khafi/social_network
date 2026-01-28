import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { 
  togglePostLike,
  togglePostSave,
  togglePostRepost,
  fetchComments,
  createComment,
  toggleCommentLike,
  archivePost,
  deletePost
} from '../../features/posts/postsSlice';
import { blockUser } from '../../features/user/userSlice';
import { Card } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
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
  Trash2
} from 'lucide-react';
import type { Post, Comment } from '../../features/posts/postsSlice';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';
import ShareDialog from './ShareDialog';
import EditPostDialog from './EditPostDialog';
import VideoPlayer from './VideoPlayer';
import { formatTime } from '../../utils/timeUtils';
import { isVideoUrl } from '../../utils/mediaUtils';

interface PostCardProps {
  post: Post;
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  isReply?: boolean;
  parentCommentId?: string;
}

function CommentItem({ comment, postId, isReply = false, parentCommentId }: CommentItemProps) {
  const dispatch = useAppDispatch();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleLike = () => {
    dispatch(toggleCommentLike({ postId, commentId: comment.id }));
  };

  const handleReply = () => {
    if (replyText.trim()) {
      dispatch(
        createComment({
          postId,
          content: replyText,
          parent_comment_id: parentCommentId || comment.id,
        })
      );
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  return (
    <div className={`${isReply ? 'ml-12' : ''}`}>
      <div className="flex gap-3 py-3">
        <Link to={`/profile/${comment.userId}`}>
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.avatar} />
            <AvatarFallback>{((comment.username || "?")[0] || "?").toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="bg-muted rounded-2xl px-3 py-2">
            <Link to={`/profile/${comment.userId}`} className="font-semibold text-sm hover:underline">
              {comment.username}
            </Link>
            <p className="text-sm mt-0.5">{comment.content}</p>
          </div>
          
          <div className="flex items-center gap-4 mt-1 px-3">
            <span className="text-xs text-muted-foreground">{formatTime(comment.timestamp)}</span>
            <button
              onClick={handleLike}
              className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
            >
              {comment.isLiked ? 'Liked' : 'Like'}
              {comment.likes > 0 && ` · ${comment.likes}`}
            </button>
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Reply
            </button>
          </div>

          {showReplyInput && (
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleReply()}
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
                      onEmojiClick={(emojiData) => setReplyText(prev => prev + emojiData.emoji)}
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
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              isReply={true}
              parentCommentId={comment.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostCard({ post }: PostCardProps) {
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.user);
  const authUser = useAppSelector((state) => state.auth.user);
  const commentsFromState = useAppSelector((state) => state.posts.postComments[post.id]);
  const comments = commentsFromState || [];
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isOwnPost = authUser?.id === post.userId;

  const handleComment = () => {
    if (comment.trim()) {
      dispatch(createComment({ postId: post.id, content: comment }));
      setComment('');
    }
  };

  const handleRepost = () => {
    dispatch(togglePostRepost(post.id));
    toast.success(post.isReposted ? 'Repost removed' : 'Post reposted!');
  };

  const handleSave = () => {
    dispatch(togglePostSave(post.id));
    toast.success(post.isSaved ? 'Post unsaved' : 'Post saved!');
  };

  const handleBlock = () => {
    if (confirm(`Block @${post.username}?`)) {
      dispatch(blockUser(post.userId));
      toast.success(`Blocked @${post.username}`);
    }
  };

  const handleReport = () => {
    toast.success('Post reported. We\'ll review it shortly.');
  };

  const handleArchive = () => {
    dispatch(archivePost(post.id));
    toast.success('Post archived');
  };

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await dispatch(deletePost(post.id)).unwrap();
      toast.success('Post deleted successfully');
    } catch (error: unknown) {
      const message = 
        (error && typeof error === 'object' && 'response' in error && 
         error.response && typeof error.response === 'object' && 'data' in error.response &&
         error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data)
          ? String(error.response.data.message)
          : 'Failed to delete post';
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
    if (showComments) {
      dispatch(fetchComments(post.id));
    }
  }, [dispatch, post.id, showComments]);

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        {/* Post Header */}
        <div className="flex items-start gap-3 mb-3">
          <Link to={`/profile/${post.userId}`}>
            <Avatar>
              <AvatarImage src={post.avatar} />
              <AvatarFallback>{((post.username || "?")[0] || "?").toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link to={`/profile/${post.userId}`} className="hover:underline">
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
                      {/* Options for own posts */}
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Post
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Post
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSave}>
                        <Bookmark className="w-4 h-4 mr-2" />
                        {post.isSaved ? 'Unsave' : 'Save'} Post
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleRepost}>
                        <Repeat className="w-4 h-4 mr-2" />
                        Repost
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleArchive}>
                        <Archive className="w-4 h-4 mr-2" />
                        Archive Post
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      {/* Options for other users' posts */}
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
                        {post.isSaved ? 'Unsave' : 'Save'} Post
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
        <p className="mb-3 whitespace-pre-wrap">{post.content}</p>

        {/* Post Media */}
        {media.length > 0 && (
          <div className="mb-3">
            <div className={media.length > 1 ? 'grid grid-cols-2 gap-2' : ''}>
              {media.map((item, index) => (
                <div key={`${post.id}-media-${index}`}>
                  {isVideoUrl(item) ? (
                    <VideoPlayer
                      src={item}
                      onDoubleTapLike={handleDoubleTapLike}
                      className={media.length > 1 ? 'h-48' : ''}
                    />
                  ) : (
                    <img
                      src={item}
                      alt="Post content"
                      className={`w-full object-cover rounded-lg ${media.length > 1 ? 'h-48' : 'max-h-96'}`}
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
            <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            {post.likesVisible && <span className="text-sm">{post.likes}</span>}
          </button>

          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 hover:text-blue-500 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.comments}</span>
          </button>

          <button
            onClick={() => dispatch(togglePostRepost(post.id))}
            className="flex items-center gap-2 hover:text-green-500 transition-colors"
          >
            <Repeat className={`w-5 h-5 ${post.isReposted ? 'text-green-500' : ''}`} />
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
            <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-current text-primary' : ''}`} />
          </button>
        </div>

        {/* Comments Section */}
        {post.commentsAllowed && showComments && (
          <>
            {comments.length > 0 && (
              <>
                <Separator className="my-3" />
                
                {/* Comments List */}
                <div className="space-y-0">
                  {displayedComments.map((commentItem) => (
                    <CommentItem
                      key={commentItem.id}
                      comment={commentItem}
                      postId={post.id}
                    />
                  ))}
                </div>

                {/* Show more/less comments */}
                {hasMoreComments && (
                  <button
                    onClick={() => setShowAllComments(!showAllComments)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-2 px-3"
                  >
                    {showAllComments 
                      ? 'Show less' 
                      : `View ${comments.length - 2} more comment${comments.length - 2 > 1 ? 's' : ''}`
                    }
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
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                className="flex-1"
              />
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger>
                  <Smile className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </PopoverTrigger>
                <PopoverContent className="w-60">
                  <EmojiPicker
                    onEmojiClick={(emoji) => setComment(comment + emoji.emoji)}
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

      {/* Share Dialog */}
      <ShareDialog 
        postId={post.id}
        open={showShareDialog} 
        onOpenChange={setShowShareDialog}
      />

      {/* Edit Post Dialog */}
      <EditPostDialog
        post={post}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </Card>
  );
}
