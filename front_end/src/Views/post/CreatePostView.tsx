import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { addPost } from '../../features/posts/postsSlice';
import { Button } from '../../Componenets/ui/button';
import { Textarea } from '../../Componenets/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '../../Componenets/ui/avatar';
import { X, Image as ImageIcon, Smile, MapPin, ArrowLeft } from 'lucide-react';
import { Card } from '../../Componenets/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../../Componenets/ui/popover';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';

export default function CreatePostView() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.user);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePost = () => {
    if (content.trim() && currentUser) {
      dispatch(addPost({
        userId: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
        content,
        images: images.length > 0 ? images : undefined,
        commentsAllowed: true,
        likesVisible: true,
        isLiked: false,
        isSaved: false,
        isReposted: false,
      }));
      toast.success('Post created successfully');
      navigate('/');
    }
  };

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Simulate image upload with preview
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiClick = (emojiData: any) => {
    setContent(prev => prev + emojiData.emoji);
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <button onClick={() => navigate('/home')} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold">Create Post</h2>
          <Button
            onClick={handlePost}
            disabled={!content.trim()}
            size="sm"
            className="bg-[#d6955b] hover:bg-[#c58549] disabled:opacity-50"
          >
            Post
          </Button>
        </div>

        <div className="p-4">
          <Card className="p-4">
            {/* User Info */}
            <div className="flex items-start gap-3 mb-4">
              <Avatar>
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback>{currentUser.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{currentUser.fullName}</p>
                <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
              </div>
            </div>

            {/* Content Input */}
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="min-h-[150px] resize-none border-none focus-visible:ring-0 text-base"
            />

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
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

            {/* Toolbar */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
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
                    <button className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground">
                      <Smile className="w-5 h-5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-0" align="start" side="top">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      width={350}
                      height={400}
                    />
                  </PopoverContent>
                </Popover>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <MapPin className="w-5 h-5" />
                </Button>
              </div>

              <span className="text-sm text-muted-foreground">
                {content.length}/500
              </span>
            </div>
          </Card>

          {/* Preview Section */}
          {content && (
            <Card className="mt-4 p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Preview</h3>
              <div className="flex gap-3">
                <Avatar>
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>{currentUser.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{currentUser.fullName}</span>
                    <span className="text-sm text-muted-foreground">@{currentUser.username}</span>
                    <span className="text-sm text-muted-foreground">· now</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{content}</p>
                  {images.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {images.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}