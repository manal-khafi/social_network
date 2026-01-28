import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, User, Bell, Lock, Palette, UserX, Heart, Archive, Activity, Info, LogOut 
} from 'lucide-react';
import { Card } from '../../Components/ui/card';
import { useAppDispatch } from '../../hooks';
import { logoutUser } from '../../features/auth/authSlice';
import { PATHS } from '../../routes/paths';
import { Separator } from '../../Components/ui/separator';

const settingsSections = [
  {
    id: 'account',
    title: 'Account Settings',
    description: 'Manage your profile and account security',
    icon: User,
    path: 'account',
    color: 'text-[#18534f]'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Configure how you receive updates',
    icon: Bell,
    path: 'notifications',
    color: 'text-[#226d68]'
  },
  {
    id: 'privacy',
    title: 'Privacy',
    description: 'Control your privacy settings',
    icon: Lock,
    path: 'privacy',
    color: 'text-[#d6955b]'
  },
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Customize the theme, text, and layout',
    icon: Palette,
    path: 'appearance',
    color: 'text-[#226d68]'
  },
  {
    id: 'blocked',
    title: 'Blocked Contacts',
    description: 'Manage the accounts you have blocked',
    icon: UserX,
    path: 'blocked-contacts',
    color: 'text-red-500'
  },
  {
    id: 'liked',
    title: 'Liked Posts',
    description: 'View all the posts you have liked',
    icon: Heart,
    path: 'liked-posts',
    color: 'text-pink-500'
  },
  {
    id: 'archive',
    title: 'Archive',
    description: 'View your archived posts',
    icon: Archive,
    path: 'archive/posts',
    color: 'text-purple-500'
  },
  {
    id: 'support',
    title: 'Info & Support',
    description: 'Help, privacy, and about ANMOUGAR',
    icon: Info,
    path: 'info',
    color: 'text-gray-500'
  }
];

export default function SettingsView() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

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
                  <h3 className="font-semibold">{section.title}</h3>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
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
              <h3 className="font-semibold text-red-500">Logout</h3>
              <p className="text-sm text-muted-foreground">You will be returned to the login screen.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
