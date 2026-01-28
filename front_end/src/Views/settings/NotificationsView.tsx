import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { toggleAllNotifications, toggleNotification} from '../../features/settings/settingsSlice';
import { ArrowLeft, Bell, Smartphone, Mail, MessageSquare } from 'lucide-react';
import { Card } from '../../Components/ui/card';
import { Switch } from '../../Components/ui/switch';
import { Separator } from '../../Components/ui/separator';
import { RadioGroup, RadioGroupItem } from '../../Components/ui/radio-group';
import { Label } from '../../Components/ui/label';

export default function NotificationsView() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector((state) => state.settings);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Notifications</h1>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        {/* Master Toggle */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#18534f]" />
              <div>
                <p className="font-semibold">All Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Enable or disable all notifications
                </p>
              </div>
            </div>
            <Switch
              checked={notifications.all}
              onCheckedChange={() => dispatch(toggleAllNotifications())}
            />
          </div>
        </Card>

        {/* Notification Channels */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Notification Channels</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
              </div>
            </div>
            <Switch
              checked={notifications.channels?.push ?? true}
              disabled={!notifications.all}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              checked={notifications.channels?.email ?? false}
              disabled={!notifications.all}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">In-App Notifications</p>
                <p className="text-sm text-muted-foreground">See notifications within the app</p>
              </div>
            </div>
            <Switch
              checked={notifications.channels?.inApp ?? true}
              disabled={!notifications.all}
            />
          </div>
        </Card>

        {/* Notification Types */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Activity Notifications</h2>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Likes</p>
              <p className="text-sm text-muted-foreground">When someone likes your post</p>
            </div>
            <Switch
              checked={notifications.likes}
              onCheckedChange={() => dispatch(toggleNotification('likes'))}
              disabled={!notifications.all}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Comments</p>
              <p className="text-sm text-muted-foreground">When someone comments on your post</p>
            </div>
            <Switch
              checked={notifications.comments}
              onCheckedChange={() => dispatch(toggleNotification('comments'))}
              disabled={!notifications.all}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Followers</p>
              <p className="text-sm text-muted-foreground">When someone follows you</p>
            </div>
            <Switch
              checked={notifications.follows}
              onCheckedChange={() => dispatch(toggleNotification('follows'))}
              disabled={!notifications.all}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Mentions</p>
              <p className="text-sm text-muted-foreground">When someone mentions you</p>
            </div>
            <Switch
              checked={notifications.mentions}
              onCheckedChange={() => dispatch(toggleNotification('mentions'))}
              disabled={!notifications.all}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reposts</p>
              <p className="text-sm text-muted-foreground">When someone reposts your content</p>
            </div>
            <Switch
              checked={notifications.reposts}
              onCheckedChange={() => dispatch(toggleNotification('reposts'))}
              disabled={!notifications.all}
            />
          </div>
        </Card>

        {/* Notification Timing */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Notification Timing</h2>
          <p className="text-sm text-muted-foreground">
            Choose when you want to receive notifications
          </p>
          
          <RadioGroup defaultValue="always">
            <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
              <RadioGroupItem value="always" id="always" />
              <Label htmlFor="always" className="flex-1 cursor-pointer">
                <p className="font-medium">Always</p>
                <p className="text-sm text-muted-foreground">Receive notifications at any time</p>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
              <RadioGroupItem value="scheduled" id="scheduled" />
              <Label htmlFor="scheduled" className="flex-1 cursor-pointer">
                <p className="font-medium">Scheduled</p>
                <p className="text-sm text-muted-foreground">Only during specific hours</p>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
              <RadioGroupItem value="important" id="important" />
              <Label htmlFor="important" className="flex-1 cursor-pointer">
                <p className="font-medium">Important Only</p>
                <p className="text-sm text-muted-foreground">Only critical notifications</p>
              </Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Messaging Notifications */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Messaging</h2>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Message Requests</p>
              <p className="text-sm text-muted-foreground">From people you don't follow</p>
            </div>
            <Switch defaultChecked disabled={!notifications.all} />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Group Messages</p>
              <p className="text-sm text-muted-foreground">When you're added to a group</p>
            </div>
            <Switch defaultChecked disabled={!notifications.all} />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Video Calls</p>
              <p className="text-sm text-muted-foreground">Incoming call notifications</p>
            </div>
            <Switch defaultChecked disabled={!notifications.all} />
          </div>
        </Card>
      </div>
    </div>
  );
}
