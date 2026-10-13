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
import { ArrowLeft, Image as ImageIcon, Smile, X, Loader2, Globe, Users, Lock } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { toast } from "sonner";
import { PATHS } from "../../routes/paths";
import { isVideoUrl } from "../../utils/mediaUtils";
import { uploadPostMedia } from "../../utils/uploadStoryMedia";

const MAX_MEDIA = 10;
const VISIBILITY = [
  { value: "public", label: "Everyone", icon: Globe },
  { value: "friends", label: "Friends", icon: Users },
  { value: "private", label: "Only me", icon: Lock },
] as const;

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
  const [uploading, setUploading] = useState(0);
  const [posting, setPosting] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canPost = (!!content.trim() || media.length > 0) && uploading === 0 && !posting;

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
    if (!canPost || !authUser) return;
    setPosting(true);
    try {
      await dispatch(
        createPost({
          content: content.trim(),
          media_urls: media.length > 0 ? media : undefined,
          visibility,
        })
      ).unwrap();

      toast.success("Post created successfully");
      navigate(PATHS.HOME);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create post");
    } finally {
      setPosting(false);
    }
  };

  const handleMediaAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    if (media.length + files.length > MAX_MEDIA) {
      toast.error(`Up to ${MAX_MEDIA} photos/videos per post`);
      return;
    }

    setUploading((n) => n + files.length);
    for (const file of files) {
      try {
        const { url } = await uploadPostMedia(file);
        setMedia((prev) => [...prev, url]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading((n) => n - 1);
      }
    }
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
            disabled={!canPost}
            size="sm"
            className="bg-[#d6955b] hover:bg-[#c58549] disabled:opacity-50"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
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
              maxLength={2200}
            />

            {/* Media Preview */}
            {(media.length > 0 || uploading > 0) && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {Array.from({ length: uploading }).map((_, i) => (
                  <div key={`up-${i}`} className="h-48 rounded-lg bg-muted grid place-items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ))}
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

                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as typeof visibility)}
                  className="ml-1 text-sm rounded-md border border-border bg-background px-2 py-1.5 text-muted-foreground"
                  aria-label="Who can see this post"
                >
                  {VISIBILITY.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-sm text-muted-foreground">{content.length}/2200</span>
            </div>
          </Card>

          {/* Preview Section */}
          {(content || media.length > 0) && (
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
