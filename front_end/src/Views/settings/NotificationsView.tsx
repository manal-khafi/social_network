import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Smartphone, Mail, MessageSquare } from "lucide-react";
import { Card } from "../../Components/ui/card";
import { Switch } from "../../Components/ui/switch";
import { Separator } from "../../Components/ui/separator";
import { RadioGroup, RadioGroupItem } from "../../Components/ui/radio-group";
import { Label } from "../../Components/ui/label";
import { toast } from "sonner";
import {
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationSettings,
} from "../../api/settingsApi";

export default function NotificationsView() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] =
    useState<NotificationSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getNotificationSettings();
        setNotifications(data);
      } catch (error) {
        toast.error("Failed to load notification settings");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = async (updates: Partial<NotificationSettings>) => {
    try {
      const updated = await updateNotificationSettings(updates);
      setNotifications(updated);
      toast.success("Settings updated");
    } catch (error) {
      toast.error("Failed to update settings");
      console.error(error);
    }
  };

  const toggleAll = () => {
    if (notifications) {
      updateSettings({ all: !notifications.all });
    }
  };

  const toggleChannel = (channel: keyof NotificationSettings["channels"]) => {
    if (notifications) {
      updateSettings({
        channels: {
          ...notifications.channels,
          [channel]: !notifications.channels[channel],
        },
      });
    }
  };

  const toggleNotificationType = (
    type: keyof Pick<
      NotificationSettings,
      "likes" | "comments" | "follows" | "mentions" | "reposts"
    >,
  ) => {
    if (notifications) {
      updateSettings({ [type]: !notifications[type] });
    }
  };

  const updateTiming = (timing: NotificationSettings["timing"]) => {
    updateSettings({ timing });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!notifications) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-muted rounded-full"
        >
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
            <Switch checked={notifications.all} onCheckedChange={toggleAll} />
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
                <p className="text-sm text-muted-foreground">
                  Receive notifications on your device
                </p>
              </div>
            </div>
            <Switch
              checked={notifications.channels.push}
              onCheckedChange={() => toggleChannel("push")}
              disabled={!notifications.all}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <Switch
              checked={notifications.channels.email}
              onCheckedChange={() => toggleChannel("email")}
              disabled={!notifications.all}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">In-App Notifications</p>
                <p className="text-sm text-muted-foreground">
                  See notifications within the app
                </p>
              </div>
            </div>
            <Switch
              checked={notifications.channels.inApp}
              onCheckedChange={() => toggleChannel("inApp")}
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
              <p className="text-sm text-muted-foreground">
                When someone likes your post
              </p>
            </div>
            <Switch
              checked={notifications.likes}
              onCheckedChange={() => toggleNotificationType("likes")}
              disabled={!notifications.all}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Comments</p>
              <p className="text-sm text-muted-foreground">
                When someone comments on your post
              </p>
            </div>
            <Switch
              checked={notifications.comments}
              onCheckedChange={() => toggleNotificationType("comments")}
              disabled={!notifications.all}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Followers</p>
              <p className="text-sm text-muted-foreground">
                When someone follows you
              </p>
            </div>
            <Switch
              checked={notifications.follows}
              onCheckedChange={() => toggleNotificationType("follows")}
              disabled={!notifications.all}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Mentions</p>
              <p className="text-sm text-muted-foreground">
                When someone mentions you
              </p>
            </div>
            <Switch
              checked={notifications.mentions}
              onCheckedChange={() => toggleNotificationType("mentions")}
              disabled={!notifications.all}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reposts</p>
              <p className="text-sm text-muted-foreground">
                When someone reposts your content
              </p>
            </div>
            <Switch
              checked={notifications.reposts}
              onCheckedChange={() => toggleNotificationType("reposts")}
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

          <RadioGroup
            value={notifications.timing}
            onValueChange={(value) =>
              updateTiming(value as NotificationSettings["timing"])
            }
          >
            <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
              <RadioGroupItem
                value="always"
                id="always"
                disabled={!notifications.all}
              />
              <Label htmlFor="always" className="flex-1 cursor-pointer">
                <p className="font-medium">Always</p>
                <p className="text-sm text-muted-foreground">
                  Receive notifications at any time
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
              <RadioGroupItem
                value="scheduled"
                id="scheduled"
                disabled={!notifications.all}
              />
              <Label htmlFor="scheduled" className="flex-1 cursor-pointer">
                <p className="font-medium">Scheduled</p>
                <p className="text-sm text-muted-foreground">
                  Only during specific hours
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
              <RadioGroupItem
                value="important"
                id="important"
                disabled={!notifications.all}
              />
              <Label htmlFor="important" className="flex-1 cursor-pointer">
                <p className="font-medium">Important Only</p>
                <p className="text-sm text-muted-foreground">
                  Only critical notifications
                </p>
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
              <p className="text-sm text-muted-foreground">
                From people you don't follow
              </p>
            </div>
            <Switch
              checked={notifications.messageRequests}
              onCheckedChange={() =>
                updateSettings({
                  messageRequests: !notifications.messageRequests,
                })
              }
              disabled={!notifications.all}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Group Messages</p>
              <p className="text-sm text-muted-foreground">
                When you're added to a group
              </p>
            </div>
            <Switch
              checked={notifications.groupMessages}
              onCheckedChange={() =>
                updateSettings({ groupMessages: !notifications.groupMessages })
              }
              disabled={!notifications.all}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Video Calls</p>
              <p className="text-sm text-muted-foreground">
                Incoming call notifications
              </p>
            </div>
            <Switch
              checked={notifications.videoCalls}
              onCheckedChange={() =>
                updateSettings({ videoCalls: !notifications.videoCalls })
              }
              disabled={!notifications.all}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
