import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { toggleTheme, setLanguage } from '../../features/settings/settingsSlice';
import { unblockUser } from '../../features/user/userSlice';
import { 
  ArrowLeft, 
  Sun, 
  Moon, 
  Laptop, 
  Type, 
  Layout, 
  Globe, 
  UserX, 
  Heart, 
  Eye 
} from 'lucide-react';
import { Card } from '../../Componenets/ui/card';
import { Switch } from '../../Componenets/ui/switch';
import { Separator } from '../../Componenets/ui/separator';
import { RadioGroup, RadioGroupItem } from '../../Componenets/ui/radio-group';
import { Label } from '../../Componenets/ui/label';
import { Button } from '../../Componenets/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../../Componenets/ui/avatar';
import PostCard from '../../Componenets/post/PostCard';
import { toast } from 'sonner';

export default function AppearanceView() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { theme, setTheme } = useTheme();
  const { theme: reduxTheme, language } = useAppSelector((state) => state.settings);
  const { blockedUsers } = useAppSelector((state) => state.user);
  const { savedPosts } = useAppSelector((state) => state.posts);

  useEffect(() => {
    if (reduxTheme && theme !== reduxTheme) {
      setTheme(reduxTheme);
    }
  }, [reduxTheme, theme, setTheme]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    if (newTheme !== 'system') {
      dispatch(toggleTheme());
    }
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleUnblock = (userId: string, username: string) => {
    dispatch(unblockUser(userId));
    toast.success(`Unblocked @${username}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Appearance</h1>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        {/* Theme */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Theme</h2>
          <p className="text-sm text-muted-foreground">
            Choose how ANMOUGAR looks to you
          </p>

          <RadioGroup value={theme} onValueChange={handleThemeChange}>
            <div className="flex items-center space-x-3 p-4 hover:bg-muted rounded-lg border-2 border-transparent data-[state=checked]:border-primary">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex-1 cursor-pointer flex items-center gap-3">
                <div className="p-3 bg-muted rounded-full">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Light</p>
                  <p className="text-sm text-muted-foreground">Bright and clean</p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-4 hover:bg-muted rounded-lg border-2 border-transparent data-[state=checked]:border-primary">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex-1 cursor-pointer flex items-center gap-3">
                <div className="p-3 bg-muted rounded-full">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Dark</p>
                  <p className="text-sm text-muted-foreground">Easy on the eyes</p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-4 hover:bg-muted rounded-lg border-2 border-transparent data-[state=checked]:border-primary">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex-1 cursor-pointer flex items-center gap-3">
                <div className="p-3 bg-muted rounded-full">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">System</p>
                  <p className="text-sm text-muted-foreground">Match your device</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Text Size */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Type className="w-5 h-5" />
            Text Size
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Aa</span>
              <span className="text-2xl">Aa</span>
            </div>
            <input
              type="range"
              min="12"
              max="20"
              defaultValue="16"
              className="w-full"
            />
            <p className="text-sm text-muted-foreground text-center">
              Preview: This is how text will appear
            </p>
          </div>
        </Card>

        {/* Layout Density */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Layout Density
          </h2>

          <RadioGroup defaultValue="comfortable">
            <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
              <RadioGroupItem value="compact" id="compact" />
              <Label htmlFor="compact" className="flex-1 cursor-pointer">
                <p className="font-medium">Compact</p>
                <p className="text-sm text-muted-foreground">Show more content</p>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
              <RadioGroupItem value="comfortable" id="comfortable" />
              <Label htmlFor="comfortable" className="flex-1 cursor-pointer">
                <p className="font-medium">Comfortable</p>
                <p className="text-sm text-muted-foreground">Balanced spacing</p>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
              <RadioGroupItem value="spacious" id="spacious" />
              <Label htmlFor="spacious" className="flex-1 cursor-pointer">
                <p className="font-medium">Spacious</p>
                <p className="text-sm text-muted-foreground">More breathing room</p>
              </Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Language */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Language
          </h2>

          <div className="space-y-2">
            {[
              { code: 'en', name: 'English', native: 'English' },
              { code: 'fr', name: 'French', native: 'Français' },
              { code: 'es', name: 'Spanish', native: 'Español' },
              { code: 'ar', name: 'Arabic', native: 'العربية' },
              { code: 'de', name: 'German', native: 'Deutsch' }
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  dispatch(setLanguage(lang.code as any));
                  toast.success(`Language changed to ${lang.name}`);
                }}
                className={`w-full text-left p-4 rounded-lg transition-colors ${
                  language === lang.code
                    ? 'bg-primary/10 text-primary font-medium border-2 border-primary'
                    : 'hover:bg-muted border-2 border-transparent'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{lang.native}</span>
                  <span className="text-sm text-muted-foreground">{lang.name}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Accessibility */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Accessibility
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">High Contrast</p>
              <p className="text-sm text-muted-foreground">
                Increase contrast for better readability
              </p>
            </div>
            <Switch />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reduced Motion</p>
              <p className="text-sm text-muted-foreground">
                Minimize animations and transitions
              </p>
            </div>
            <Switch />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Screen Reader</p>
              <p className="text-sm text-muted-foreground">
                Optimize for screen reader users
              </p>
            </div>
            <Switch />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Larger Touch Targets</p>
              <p className="text-sm text-muted-foreground">
                Make buttons easier to tap
              </p>
            </div>
            <Switch />
          </div>
        </Card>

        {/* Color Customization */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Color Customization</h2>
          <p className="text-sm text-muted-foreground">
            ANMOUGAR uses a carefully crafted color palette
          </p>

          <div className="grid grid-cols-5 gap-3">
            <div className="space-y-2">
              <div className="w-full aspect-square rounded-lg bg-[#18534f]" />
              <p className="text-xs text-center text-muted-foreground">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="w-full aspect-square rounded-lg bg-[#226d68]" />
              <p className="text-xs text-center text-muted-foreground">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="w-full aspect-square rounded-lg bg-[#ecf8f6] border" />
              <p className="text-xs text-center text-muted-foreground">Background</p>
            </div>
            <div className="space-y-2">
              <div className="w-full aspect-square rounded-lg bg-[#feeaa1]" />
              <p className="text-xs text-center text-muted-foreground">Accent</p>
            </div>
            <div className="space-y-2">
              <div className="w-full aspect-square rounded-lg bg-[#d6955b]" />
              <p className="text-xs text-center text-muted-foreground">Highlight</p>
            </div>
          </div>
        </Card>

        {/* Blocked Accounts */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <UserX className="w-5 h-5" />
            Blocked Accounts
            {blockedUsers.length > 0 && (
              <span className="ml-auto text-sm text-muted-foreground">
                {blockedUsers.length}
              </span>
            )}
          </h2>

          {blockedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blocked accounts</p>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(user.id, user.username)}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Liked Posts */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Liked Posts
            {savedPosts.filter(p => p.isLiked).length > 0 && (
              <span className="ml-auto text-sm text-muted-foreground">
                {savedPosts.filter(p => p.isLiked).length}
              </span>
            )}
          </h2>

          {savedPosts.filter(p => p.isLiked).length === 0 ? (
            <p className="text-sm text-muted-foreground">No liked posts</p>
          ) : (
            <div className="space-y-3">
              {savedPosts.filter(p => p.isLiked).map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}