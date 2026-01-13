import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { updateProfile } from '../../features/user/userSlice';
import { togglePrivacy } from '../../features/user/userSlice';
import { Card } from '../../Componenets/ui/card';
import { Input } from '../../Componenets/ui/input';
import { Textarea } from '../../Componenets/ui/textarea';
import { Button } from '../../Componenets/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../../Componenets/ui/avatar';
import { Switch } from '../../Componenets/ui/switch';
import { Separator } from '../../Componenets/ui/separator';
import { Camera, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function EditProfileView() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.user);
  const profilePicRef = useRef<HTMLInputElement>(null);
  const coverPicRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    username: currentUser?.username || '',
    fullName: currentUser?.fullName || '',
    bio: currentUser?.bio || '',
    location: '',
    dateOfBirth: '',
  });

  const [isPrivate, setIsPrivate] = useState(!currentUser?.isPublic);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username,
        fullName: currentUser.fullName,
        bio: currentUser.bio,
        location: '',
        dateOfBirth: '',
      });
      setIsPrivate(!currentUser.isPublic);
    }
  }, [currentUser]);

  const handleSave = () => {
    dispatch(updateProfile({
      username: formData.username,
      fullName: formData.fullName,
      bio: formData.bio,
    }));
    
    if (isPrivate !== !currentUser?.isPublic) {
      dispatch(togglePrivacy());
    }
    
    toast.success('Profile updated successfully');
    navigate('/profile/me');
  };

  const handleCancel = () => {
    navigate('/profile/me');
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, this would upload the file
      toast.success('Profile picture updated');
    }
  };

  const handleCoverPicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, this would upload the file
      toast.success('Cover photo updated');
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <button onClick={handleCancel} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold">Edit Profile</h2>
          <Button
            onClick={handleSave}
            size="sm"
            className="bg-[#d6955b] hover:bg-[#c58549]"
          >
            Save
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Cover Photo */}
          <Card className="overflow-hidden">
            <div className="relative h-48 bg-muted">
              {currentUser.coverImage && (
                <img
                  src={currentUser.coverImage}
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
                onClick={() => coverPicRef.current?.click()}
                className="absolute bottom-4 right-4 p-3 bg-background/90 rounded-full hover:bg-background shadow-lg"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </Card>

          {/* Profile Picture */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Profile Picture</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback className="text-2xl">
                    {currentUser.username[0].toUpperCase()}
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
                  onClick={() => profilePicRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-primary-foreground hover:bg-primary/90 shadow-lg"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Upload a new profile picture
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG or GIF. Max 5MB
                </p>
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
              <p className="text-xs text-muted-foreground">
                Your unique username on ANMOUGAR
              </p>
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
              <p className="text-xs text-muted-foreground text-right">
                {formData.bio.length}/150
              </p>
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
              <p className="text-xs text-muted-foreground">
                This won't be shown publicly
              </p>
            </div>
          </Card>

          {/* Privacy Settings */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Privacy</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Private Account</p>
                <p className="text-sm text-muted-foreground">
                  Only approved followers can see your posts and stories
                </p>
              </div>
              <Switch
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Allow Comments</p>
                <p className="text-sm text-muted-foreground">
                  People can comment on your posts
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Allow Mentions</p>
                <p className="text-sm text-muted-foreground">
                  People can mention you in posts and comments
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Show Activity Status</p>
                <p className="text-sm text-muted-foreground">
                  Let people see when you're online
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-6">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-[#d6955b] hover:bg-[#c58549]"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}