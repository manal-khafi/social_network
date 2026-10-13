import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, User, Bell, Lock, Palette, UserX, Heart, Archive, Activity, Info, LogOut, Star
} from 'lucide-react';
import { Card } from '../../Components/ui/card';
import { useAppDispatch } from '../../hooks';
import { logoutUser } from '../../features/auth/authSlice';
import { PATHS } from '../../routes/paths';
import { Separator } from '../../Components/ui/separator';
import { useTranslation } from 'react-i18next';

// title / description are i18n keys, resolved with t() at render time.
const settingsSections = [
  {
    id: 'account',
    title: 'settings.account',
    description: 'settings.accountDescription',
    icon: User,
    path: 'account',
    color: 'text-[#18534f]'
  },
  {
    id: 'notifications',
    title: 'settings.notifications',
    description: 'settings.notificationsDescription',
    icon: Bell,
    path: 'notifications',
    color: 'text-[#226d68]'
  },
  {
    id: 'privacy',
    title: 'settings.privacy',
    description: 'settings.privacyDescription',
    icon: Lock,
    path: 'privacy',
    color: 'text-[#d6955b]'
  },
  {
    id: 'appearance',
    title: 'settings.appearance',
    description: 'settings.appearanceDescription',
    icon: Palette,
    path: 'appearance',
    color: 'text-[#226d68]'
  },
  {
    id: 'close-friends',
    title: 'settings.closeFriends',
    description: 'settings.closeFriendsDescription',
    icon: Star,
    path: 'close-friends',
    color: 'text-green-500'
  },
  {
    id: 'blocked',
    title: 'settings.blocked',
    description: 'settings.blockedDescription',
    icon: UserX,
    path: 'blocked-contacts',
    color: 'text-red-500'
  },
  {
    id: 'liked',
    title: 'settings.liked',
    description: 'settings.likedDescription',
    icon: Heart,
    path: 'liked-posts',
    color: 'text-pink-500'
  },
  {
    id: 'archive',
    title: 'settings.archive',
    description: 'settings.archiveDescription',
    icon: Archive,
    path: 'archive/posts',
    color: 'text-purple-500'
  },
  {
    id: 'support',
    title: 'settings.support',
    description: 'settings.supportDescription',
    icon: Info,
    path: 'info',
    color: 'text-gray-500'
  }
];

export default function SettingsView() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      navigate(PATHS.AUTH, { replace: true });
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Settings Sections */}
      <div className="p-4 space-y-2 max-w-2xl mx-auto pb-24">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.id}
              className="hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate(section.path)}
            >
              <div className="p-4 flex items-center gap-4">
                <div className={`p-3 bg-muted rounded-full ${section.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{t(section.title)}</h3>
                  <p className="text-sm text-muted-foreground">{t(section.description)}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          );
        })}

        <Separator className="my-4" />

        <Card
          className="hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={handleLogout}
        >
          <div className="p-4 flex items-center gap-4">
            <div className="p-3 bg-muted rounded-full text-red-500">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-500">{t('settings.logout')}</h3>
              <p className="text-sm text-muted-foreground">{t('settings.logoutDescription')}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
