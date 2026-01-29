import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { createPost } from "../../features/posts/postsSlice";
import { fetchCurrentUserProfile } from "../../features/user/userSlice";
import { Button } from "../../Components/ui/button";
import { Textarea } from "../../Components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../../Components/ui/avatar";
import { Card } from "../../Components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../../Components/ui/popover";
import { ArrowLeft, Image as ImageIcon, MapPin, Smile, X } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { toast } from "sonner";
import { PATHS } from "../../routes/paths";
import { isVideoUrl } from "../../utils/mediaUtils";

export default function CreatePostView() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // auth is only used to know if logged in
  const authUser = useAppSelector((s) => s.auth.user);

  // profile slice contains avatar_url + display_name
  const currentUser = useAppSelector((s) => s.user.currentUser);
  const userStatus = useAppSelector((s) => s.user.status);

  const [content, setContent] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure we have profile data when opening Create Post
  useEffect(() => {
    if (authUser && !currentUser && userStatus !== "loading") {
      dispatch(fetchCurrentUserProfile());
    }
  }, [authUser, currentUser, userStatus, dispatch]);

  const resolvedUser = currentUser ?? null;

  const avatarSrc = resolvedUser?.avatar_url || "";
  const displayName = resolvedUser?.display_name || resolvedUser?.username || "User";
  const handle = resolvedUser?.username ? `@${resolvedUser.username}` : "@unknown";

  const handlePost = async () => {
    if (!content.trim() || !authUser) return;

    try {
      await dispatch(
        createPost({
          content,
          authorId: authUser.id,
          media_urls: media.length > 0 ? media : undefined,
        })
      ).unwrap();

      toast.success("Post created successfully");
      navigate(PATHS.HOME);
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to create post";
      toast.error(message);
    }
  };

  const handleMediaAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);

    const dataUrls = await Promise.all(
      fileArray.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
      )
    );

    setMedia((prev) => [...prev, ...dataUrls]);
  };

  const handleRemoveMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEmojiClick = (emojiData: any) => {
    setContent((prev) => prev + emojiData.emoji);
  };

  // Not logged in
  if (!authUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="mb-4">You must be logged in to create a post.</p>
        <Link to={PATHS.AUTH} className="text-blue-500 hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  // Logged in but profile is still loading
  if (!resolvedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="mb-2 font-medium">Loading your profile…</p>
        <p className="text-sm text-muted-foreground">Please wait a moment.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full"
            aria-label="Back"
          >
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
                <AvatarImage src={avatarSrc} />
                <AvatarFallback>
                  {(displayName?.[0] || resolvedUser.username?.[0] || "?").toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="font-semibold">{displayName}</p>
                <p className="text-sm text-muted-foreground">{handle}</p>
              </div>
            </div>

            {/* Content Input */}
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="min-h-[150px] resize-none border-none focus-visible:ring-0 text-base"
              maxLength={500}
            />

            {/* Media Preview */}
            {media.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {media.map((m, index) => (
                  <div key={index} className="relative group">
                    {isVideoUrl(m) ? (
                      <video
                        src={m}
                        controls
                        className="w-full h-48 object-cover rounded-lg bg-black"
                      />
                    ) : (
                      <img
                        src={m}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}

                    <button
                      onClick={() => handleRemoveMedia(index)}
                      className="absolute top-2 right-2 p-1.5 bg-background/90 rounded-full hover:bg-background shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove media"
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
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaAdd}
                  className="hidden"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Add media"
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground"
                      aria-label="Add emoji"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0 border-0" align="start" side="top">
                    <EmojiPicker onEmojiClick={handleEmojiClick} width={350} height={400} />
                  </PopoverContent>
                </Popover>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Add location"
                >
                  <MapPin className="w-5 h-5" />
                </Button>
              </div>

              <span className="text-sm text-muted-foreground">{content.length}/500</span>
            </div>
          </Card>

          {/* Preview Section */}
          {content && (
            <Card className="mt-4 p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Preview</h3>

              <div className="flex gap-3">
                <Avatar>
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback>
                    {(displayName?.[0] || resolvedUser.username?.[0] || "?").toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{displayName}</span>
                    <span className="text-sm text-muted-foreground">{handle}</span>
                    <span className="text-sm text-muted-foreground">· now</span>
                  </div>

                  <p className="mt-1 whitespace-pre-wrap">{content}</p>

                  {media.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {media.map((m, index) =>
                        isVideoUrl(m) ? (
                          <video
                            key={index}
                            src={m}
                            controls
                            className="w-full h-48 object-cover rounded-lg bg-black"
                          />
                        ) : (
                          <img
                            key={index}
                            src={m}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        )
                      )}
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
