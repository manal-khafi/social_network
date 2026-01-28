import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { saveMyProfile, updateMyAvatar, updateCoverImage } from "../../features/user/userSlice";
import { uploadImageAndGetURL } from "../../utils/uploadImageAndGetURL";

type Props = {
  showCover?: boolean;
  showSaveButton?: boolean;
  onSaved?: () => void;
};

export default function ProfileEditorSection({
  showCover = true,
  showSaveButton = true,
  onSaved,
}: Props) {
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.user);

  const profilePicRef = useRef<HTMLInputElement>(null);
  const coverPicRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    avatar_url: "",
    username: "",
    fullName: "",
    bio: "",
    location: "",
    dateOfBirth: "",
    allowComments: true,
    allowMentions: true,
    showActivityStatus: true,
  });

  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    setFormData({
      avatar_url: currentUser.avatar_url ?? "",
      username: currentUser.username ?? "",
      fullName: currentUser.display_name ?? "",
      bio: currentUser.bio ?? "",
      location: currentUser.adresse ?? "",
      dateOfBirth: currentUser.date_of_birth ? currentUser.date_of_birth.slice(0, 10) : "",
      allowComments: currentUser.allow_comments ?? true,
      allowMentions: currentUser.allow_mentions ?? true,
      showActivityStatus: currentUser.show_activity_status ?? true,
    });

    setIsPrivate(currentUser.is_private ?? false);
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      await dispatch(
        saveMyProfile({
          username: formData.username.trim(),
          display_name: formData.fullName.trim(),
          bio: formData.bio?.trim() || null,
          adresse: formData.location?.trim() || null,
          date_of_birth: formData.dateOfBirth || null,
          is_private: isPrivate,
          allow_comments: formData.allowComments,
          allow_mentions: formData.allowMentions,
          show_activity_status: formData.showActivityStatus,
        })
      ).unwrap();

      toast.success("Profile updated successfully");
      onSaved?.();
    } catch (err: any) {
      toast.error(String(err));
    }
  };

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return toast.error("File must be an image");
    if (file.size > 5 * 1024 * 1024) return toast.error("Max size is 5MB");

    try {
      const url = await uploadImageAndGetURL(file, "avatars");
      await dispatch(updateMyAvatar({ avatar_url: url })).unwrap();
      toast.success("Profile picture updated");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update picture");
    }
  };

  const handleCoverPicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return toast.error("File must be an image");
    if (file.size > 5 * 1024 * 1024) return toast.error("Max size is 5MB");

    try {
      const url = await uploadImageAndGetURL(file, "covers");
      await dispatch(updateCoverImage({ cover_image: url })).unwrap();
      toast.success("Cover photo updated");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update cover photo");
    }
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      {/* Cover Photo */}
      {showCover && (
        <Card className="overflow-hidden">
          <div className="relative h-48 bg-muted">
            {currentUser.cover_image && (
              <img
                src={currentUser.cover_image}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}

            <input
              ref={coverPicRef}
              type="file"
              accept="image/*"
              onChange={handleCoverPicChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => coverPicRef.current?.click()}
              className="absolute bottom-4 right-4 p-3 bg-background/90 rounded-full hover:bg-background shadow-lg"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
        </Card>
      )}

      {/* Profile Picture */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Profile Picture</h3>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={currentUser.avatar_url ?? undefined} />
              <AvatarFallback className="text-2xl">
                {(currentUser.username?.[0] ?? "?").toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <input
              ref={profilePicRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePicChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => profilePicRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-primary-foreground hover:bg-primary/90 shadow-lg"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Upload a new profile picture</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF. Max 5MB</p>
          </div>
        </div>
      </Card>

      {/* Basic Information */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Basic Information</h3>

        <div className="space-y-2">
          <label className="text-sm">Username</label>
          <Input
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="username"
          />
          <p className="text-xs text-muted-foreground">Your unique username on ANMOUGAR</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm">Full Name</label>
          <Input
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Full Name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm">Bio</label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell us about yourself..."
            className="resize-none"
            rows={4}
          />
          <p className="text-xs text-muted-foreground text-right">{(formData.bio ?? "").length}/160</p>
        </div>
      </Card>

      {/* Additional Information */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Additional Information</h3>

        <div className="space-y-2">
          <label className="text-sm">Location</label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="City, Country"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm">Date of Birth</label>
          <Input
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            type="date"
          />
          <p className="text-xs text-muted-foreground">This won't be shown publicly</p>
        </div>
      </Card>

      {/* Privacy Settings */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Privacy</h3>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-medium">Private Account</p>
            <p className="text-sm text-muted-foreground">Only approved followers can see your posts and stories</p>
          </div>
          <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-medium">Allow Comments</p>
            <p className="text-sm text-muted-foreground">People can comment on your posts</p>
          </div>
          <Switch
            checked={formData.allowComments}
            onCheckedChange={(checked) => setFormData({ ...formData, allowComments: checked })}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-medium">Allow Mentions</p>
            <p className="text-sm text-muted-foreground">People can mention you in posts and comments</p>
          </div>
          <Switch
            checked={formData.allowMentions}
            onCheckedChange={(checked) => setFormData({ ...formData, allowMentions: checked })}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-medium">Show Activity Status</p>
            <p className="text-sm text-muted-foreground">Let people see when you're online</p>
          </div>
          <Switch
            checked={formData.showActivityStatus}
            onCheckedChange={(checked) => setFormData({ ...formData, showActivityStatus: checked })}
          />
        </div>
      </Card>

      {showSaveButton && (
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-[#d6955b] hover:bg-[#c58549]">
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
