import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { togglePostRepost, type Post } from '../../features/posts/postsSlice';
import api from '../../api/axios';
import StoryComposer from '../story/StoryComposer';
import RecipientPickerSheet from '../share/RecipientPickerSheet';
import type { SharedPostRef } from '../../api/storiesApi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import {
  Send,
  Repeat,
  Copy,
  BookmarkPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ShareDialogProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Public link to a post; /post/:id redirects to /home/post/:id (see App.tsx). */
export const postLink = (postId: string) => `${window.location.origin}/post/${postId}`;

/** navigator.clipboard needs a secure context; fall back to a hidden textarea. */
const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand('copy');
  area.remove();
  if (!ok) throw new Error('copy failed');
};

export default function ShareDialog({ post, open, onOpenChange }: ShareDialogProps) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const me = useAppSelector((s) => s.auth.user);
  // Opened from the dialog, they outlive it: the dialog closes first.
  const [storyOpen, setStoryOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reposting, setReposting] = useState(false);

  // Same rule as the API: only public posts (or your own) can go on a story.
  const canShareToStory = post.visibility === 'public' || post.visibility === undefined || post.userId === me?.id;

  const sharedPost: SharedPostRef = {
    id: post.id,
    content: post.content,
    media_urls: post.images ?? [],
    created_at: post.timestamp,
    user: {
      id: post.userId,
      username: post.username,
      display_name: post.username,
      avatar_url: post.avatar ?? null,
    },
  };

  const handleShareToStory = () => {
    if (!canShareToStory) {
      toast.error(t('posts.shareDialog.storyNotAllowed'));
      return;
    }
    onOpenChange(false);
    setStoryOpen(true);
  };

  const handleShareToFeed = async () => {
    if (post.isReposted) {
      toast.info(t('posts.shareDialog.alreadyReposted'));
      onOpenChange(false);
      return;
    }
    setReposting(true);
    try {
      await dispatch(togglePostRepost(post.id)).unwrap();
      toast.success(t('posts.shareDialog.sharedToFeed'));
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : t('posts.shareDialog.repostFailed'));
    } finally {
      setReposting(false);
    }
  };

  const handleShareViaMessages = () => {
    onOpenChange(false);
    setPickerOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      await copyText(postLink(post.id));
      toast.success(t('posts.shareDialog.linkCopied'));
      onOpenChange(false);
    } catch {
      toast.error(t('posts.shareDialog.copyFailed'));
    }
  };

  const sendToPeople = async (recipientIds: string[], note: string | undefined) => {
    const res = await api.post(`/posts/${post.id}/share`, { recipient_ids: recipientIds, note });
    const { shared_count, skipped_count } = res.data.data as { shared_count: number; skipped_count: number };
    // Nobody could receive it: an error keeps the picker open.
    if (shared_count === 0) throw new Error(t('posts.shareDialog.someCannotSee', { count: skipped_count }));
    if (skipped_count > 0) toast.info(t('posts.shareDialog.someCannotSee', { count: skipped_count }));
    return shared_count;
  };

  return (
    <>
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
              disabled={reposting}
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

      <StoryComposer open={storyOpen} onClose={() => setStoryOpen(false)} sharedPost={sharedPost} />

      {pickerOpen && (
        <RecipientPickerSheet position="fixed" onClose={() => setPickerOpen(false)} onSend={sendToPeople} />
      )}
    </>
  );
}
