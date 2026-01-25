import { Link, useLocation } from 'react-router-dom';
import { Home, Users, PlusCircle, Mail, User } from 'lucide-react';
import { PATHS } from '../../routes/paths';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { path: PATHS.FEED, icon: Home, label: 'Home' },
    { path: PATHS.COMMUNITY, icon: Users, label: 'Community' },
    { path: PATHS.CREATE_POST, icon: PlusCircle, label: 'Create' },
    { path: PATHS.INBOX, icon: Mail, label: 'Inbox' },
    { path: PATHS.PROFILE_ME, icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 lg:hidden">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
