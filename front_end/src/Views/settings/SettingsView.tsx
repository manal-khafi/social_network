import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, User, Bell, Lock, MessageSquare, Palette, Database, Info, Shield } from 'lucide-react';
import { Card } from '../../Componenets/ui/card';

const settingsSections = [
  {
    id: 'account',
    title: 'Account Settings',
    description: 'Manage your profile and account security',
    icon: User,
    path: '/home/settings/account',
    color: 'text-[#18534f]'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Configure how you receive updates',
    icon: Bell,
    path: '/home/settings/notifications',
    color: 'text-[#226d68]'
  },
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Theme, blocked accounts, and liked posts',
    icon: Palette,
    path: '/home/settings/appearance',
    color: 'text-[#226d68]'
  },
  {
    id: 'about',
    title: 'About & Support',
    description: 'App info, help, and support',
    icon: Info,
    path: '/home/settings/about',
    color: 'text-[#18534f]'
  }
];

export default function SettingsView() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

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
      </div>
    </div>
  );
}