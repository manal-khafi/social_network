import { useState } from 'react';
import { useAppDispatch } from '../../hooks';
import { repostPost } from '../../features/posts/postsSlice';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { 
  Share2, 
  Send, 
  MessageCircle, 
  Repeat,
  Copy,
  BookmarkPlus
} from 'lucide-react';
import { toast } from 'sonner';

interface ShareDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShareDialog({ postId, open, onOpenChange }: ShareDialogProps) {
  const dispatch = useAppDispatch();
  const [caption, setCaption] = useState('');

  const handleShareToFeed = () => {
    dispatch(repostPost(postId));
    toast.success('Shared to feed');
    onOpenChange(false);
  };

  const handleShareToStory = () => {
    toast.success('Shared to your story');
    onOpenChange(false);
  };

  const handleShareViaMessages = () => {
    toast.success('Opening messages...');
    onOpenChange(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://anmougar.app/post/${postId}`);
    toast.success('Link copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          <Button
            onClick={handleShareToStory}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
          >
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
              <BookmarkPlus className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold">Share to Story</p>
              <p className="text-xs text-muted-foreground">Share this post to your story</p>
            </div>
          </Button>

          <Button
            onClick={handleShareToFeed}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
          >
            <div className="p-2 bg-green-500 rounded-full">
              <Repeat className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold">Share to Feed</p>
              <p className="text-xs text-muted-foreground">Repost this on your profile</p>
            </div>
          </Button>

          <Button
            onClick={handleShareViaMessages}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
          >
            <div className="p-2 bg-blue-500 rounded-full">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold">Share via Messages</p>
              <p className="text-xs text-muted-foreground">Send this post to your friends</p>
            </div>
          </Button>

          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
          >
            <div className="p-2 bg-gray-500 rounded-full">
              <Copy className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold">Copy Link</p>
              <p className="text-xs text-muted-foreground">Copy link to clipboard</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
