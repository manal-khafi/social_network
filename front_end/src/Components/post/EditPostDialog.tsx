import { useState, useRef, useEffect } from 'react';
import { useAppDispatch } from '../../hooks';
import { updatePost } from '../../features/posts/postsSlice';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { X, Image as ImageIcon, Smile } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';
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
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setContent(post.content);
      setImages(post.images || []);
    }
  }, [open, post]);

  const handleImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const dataUrls = await Promise.all(
        fileArray.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );
      setImages((prev) => [...prev, ...dataUrls]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Post content cannot be empty');
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

          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
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
                accept="image/*"
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
                disabled={!content.trim() || isLoading}
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
