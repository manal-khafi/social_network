import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppSelector, useAppDispatch } from '../../hooks';
import {
  fetchNotificationSettings,
  updateNotificationSettings,
} from '../../features/settings/settingsSlice';
import type { NotificationPreferences } from '../../features/settings/settingsSlice';
import { ArrowLeft, Bell, Smartphone, Mail, MessageSquare } from 'lucide-react';
import { Card } from '../../Components/ui/card';
import { Switch } from '../../Components/ui/switch';
import { Separator } from '../../Components/ui/separator';
import { RadioGroup, RadioGroupItem } from '../../Components/ui/radio-group';
import { Label } from '../../Components/ui/label';


import { useTranslation } from 'react-i18next';

export default function NotificationsView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector((state) => state.settings);

  // Preferences live on the server; load the saved values when the page opens.
  useEffect(() => {
    dispatch(fetchNotificationSettings());
  }, [dispatch]);

  const savePreferences = async (changes: Partial<NotificationPreferences>) => {
    try {
      await dispatch(updateNotificationSettings(changes)).unwrap();
    } catch (message) {
      toast.error(typeof message === 'string' ? message : t("notificationSettings.failedToSaveNotificationSettings"));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{t("notificationSettings.notifications")}</h1>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        {/* Master Toggle */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#18534f]" />
              <div>
                <p className="font-semibold">{t("notificationSettings.allNotifications")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("notificationSettings.enableOrDisableAllNotifications")}
                </p>
              </div>
            </div>
            <Switch
              checked={notifications.all}
              onCheckedChange={(checked) =>
                savePreferences({
                  likes: checked,
                  comments: checked,
                  follows: checked,
                  mentions: checked,
                  reposts: checked,
                })
              }
            />
          </div>
        </Card>

        {/* Notification Channels */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">{t("notificationSettings.notificationChannels")}</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{t("notificationSettings.pushNotifications")}</p>
                <p className="text-sm text-muted-foreground">{t("notificationSettings.receiveNotificationsOnYourDevice")}</p>
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
                <p className="font-medium">{t("notificationSettings.emailNotifications")}</p>
                <p className="text-sm text-muted-foreground">{t("notificationSettings.receiveNotificationsViaEmail")}</p>
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
                <p className="font-medium">{t("notificationSettings.inAppNotifications")}</p>
                <p className="text-sm text-muted-foreground">{t("notificationSettings.seeNotificationsWithinTheApp")}</p>
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
          <h2 className="font-semibold">{t("notificationSettings.activityNotifications")}</h2>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("notificationSettings.likes")}</p>
              <p className="text-sm text-muted-foreground">{t("notificationSettings.whenSomeoneLikesYourPost")}</p>
            </div>
            <Switch
              checked={notifications.likes}
              onCheckedChange={(checked) => savePreferences({ likes: checked })}
              disabled={!notifications.all}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("notificationSettings.comments")}</p>
              <p className="text-sm text-muted-foreground">{t("notificationSettings.whenSomeoneCommentsOnYourPost")}</p>
            </div>
            <Switch
              checked={notifications.comments}
              onCheckedChange={(checked) => savePreferences({ comments: checked })}
              disabled={!notifications.all}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("notificationSettings.newFollowers")}</p>
              <p className="text-sm text-muted-foreground">{t("notificationSettings.whenSomeoneFollowsYouAsksTo")}</p>
            </div>
            <Switch
              checked={notifications.follows}
              onCheckedChange={(checked) => savePreferences({ follows: checked })}
              disabled={!notifications.all}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("notificationSettings.mentions")}</p>
              <p className="text-sm text-muted-foreground">{t("notificationSettings.whenSomeoneMentionsYou")}</p>
            </div>
            <Switch
              checked={notifications.mentions}
              onCheckedChange={(checked) => savePreferences({ mentions: checked })}
              disabled={!notifications.all}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("notificationSettings.reposts")}</p>
              <p className="text-sm text-muted-foreground">{t("notificationSettings.whenSomeoneRepostsYourContent")}</p>
            </div>
            <Switch
              checked={notifications.reposts}
              onCheckedChange={(checked) => savePreferences({ reposts: checked })}
              disabled={!notifications.all}
            />
          </div>
        </Card>

        {/* Notification Timing */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">{t("notificationSettings.notificationTiming")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("notificationSettings.chooseWhenYouWantToReceive")}
          </p>
          
          <RadioGroup defaultValue="always">
            <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
              <RadioGroupItem value="always" id="always" />
              <Label htmlFor="always" className="flex-1 cursor-pointer">
                <p className="font-medium">{t("notificationSettings.always")}</p>
                <p className="text-sm text-muted-foreground">{t("notificationSettings.receiveNotificationsAtAnyTime")}</p>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
              <RadioGroupItem value="scheduled" id="scheduled" />
              <Label htmlFor="scheduled" className="flex-1 cursor-pointer">
                <p className="font-medium">{t("notificationSettings.scheduled")}</p>
                <p className="text-sm text-muted-foreground">{t("notificationSettings.onlyDuringSpecificHours")}</p>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg">
              <RadioGroupItem value="important" id="important" />
              <Label htmlFor="important" className="flex-1 cursor-pointer">
                <p className="font-medium">{t("notificationSettings.importantOnly")}</p>
                <p className="text-sm text-muted-foreground">{t("notificationSettings.onlyCriticalNotifications")}</p>
              </Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Messaging Notifications */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">{t("notificationSettings.messaging")}</h2>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("notificationSettings.messageRequests")}</p>
              <p className="text-sm text-muted-foreground">{t("notificationSettings.fromPeopleYouDontFollow")}</p>
            </div>
            <Switch defaultChecked disabled={!notifications.all} />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("notificationSettings.groupMessages")}</p>
              <p className="text-sm text-muted-foreground">{t("notificationSettings.whenYoureAddedToAGroup")}</p>
            </div>
            <Switch defaultChecked disabled={!notifications.all} />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("notificationSettings.videoCalls")}</p>
              <p className="text-sm text-muted-foreground">{t("notificationSettings.incomingCallNotifications")}</p>
            </div>
            <Switch defaultChecked disabled={!notifications.all} />
          </div>
        </Card>
      </div>
    </div>
  );
}
