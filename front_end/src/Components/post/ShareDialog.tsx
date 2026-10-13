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
import { useTranslation } from 'react-i18next';

interface ShareDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShareDialog({ postId, open, onOpenChange }: ShareDialogProps) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [caption, setCaption] = useState('');

  const handleShareToFeed = () => {
    dispatch(repostPost(postId));
    toast.success(t('posts.shareDialog.sharedToFeed'));
    onOpenChange(false);
  };

  const handleShareToStory = () => {
    toast.success(t('posts.shareDialog.sharedToStory'));
    onOpenChange(false);
  };

  const handleShareViaMessages = () => {
    toast.success(t('posts.shareDialog.openingMessages'));
    onOpenChange(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://anmougar.app/post/${postId}`);
    toast.success(t('posts.shareDialog.linkCopied'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('posts.shareDialog.title')}</DialogTitle>
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
            <div className="text-start">
              <p className="font-semibold">{t('posts.shareDialog.toStory')}</p>
              <p className="text-xs text-muted-foreground">{t('posts.shareDialog.toStoryDesc')}</p>
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
            <div className="text-start">
              <p className="font-semibold">{t('posts.shareDialog.toFeed')}</p>
              <p className="text-xs text-muted-foreground">{t('posts.shareDialog.toFeedDesc')}</p>
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
            <div className="text-start">
              <p className="font-semibold">{t('posts.shareDialog.viaMessages')}</p>
              <p className="text-xs text-muted-foreground">{t('posts.shareDialog.viaMessagesDesc')}</p>
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
            <div className="text-start">
              <p className="font-semibold">{t('posts.shareDialog.copyLink')}</p>
              <p className="text-xs text-muted-foreground">{t('posts.shareDialog.copyLinkDesc')}</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
