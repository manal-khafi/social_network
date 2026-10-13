import { useState, useRef, useEffect } from 'react';
import { useAppDispatch } from '../../hooks';
import { updatePost } from '../../features/posts/postsSlice';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { X, Image as ImageIcon, Smile, Loader2 } from 'lucide-react';
import { uploadPostMedia } from '../../utils/uploadStoryMedia';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';
import { isVideoUrl } from '../../utils/mediaUtils';
import type { Post } from '../../features/posts/postsSlice';

interface EditPostDialogProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditPostDialog({ post, open, onOpenChange }: EditPostDialogProps) {
  const dispatch = useAppDispatch();
  const [content, setContent] = useState(post.content);
  const [images, setImages] = useState<string[]>(post.images || []);
  const [uploading, setUploading] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setContent(post.content);
      setImages(post.images || []);
    }
  }, [open, post]);

  const handleImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    if (images.length + files.length > 10) {
      toast.error('Up to 10 photos/videos per post');
      return;
    }
    setUploading((n) => n + files.length);
    for (const file of files) {
      try {
        const { url } = await uploadPostMedia(file);
        setImages((prev) => [...prev, url]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!content.trim() && images.length === 0) {
      toast.error('Add text or media');
      return;
    }
    if (uploading > 0) {
      toast.error('Wait for uploads to finish');
      return;
    }

    setIsLoading(true);
    try {
      await dispatch(
        updatePost({
          postId: post.id,
          content,
          media_urls: images.length > 0 ? images : undefined,
        })
      ).unwrap();
      toast.success('Post updated successfully');
      onOpenChange(false);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to update post';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[150px] resize-none"
          />

          {(images.length > 0 || uploading > 0) && (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: uploading }).map((_, i) => (
                <div key={`up-${i}`} className="h-48 rounded-lg bg-muted grid place-items-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ))}
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  {isVideoUrl(img) ? (
                    <video
                      src={img}
                      controls
                      className="w-full h-48 object-cover rounded-lg bg-black"
                    />
                  ) : (
                    <img
                      src={img}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-background/90 rounded-full hover:bg-background shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleImageAdd}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-muted-foreground hover:text-foreground"
              >
                <ImageIcon className="w-5 h-5" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Smile className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-0" align="start" side="top">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => setContent((prev) => prev + emojiData.emoji)}
                    width={350}
                    height={400}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={(!content.trim() && images.length === 0) || isLoading || uploading > 0}
                className="bg-[#d6955b] hover:bg-[#c58549]"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
