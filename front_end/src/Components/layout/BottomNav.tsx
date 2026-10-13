import { Link, useLocation } from 'react-router-dom';
import { Home, Users, PlusCircle, Mail, User } from 'lucide-react';
import { PATHS } from '../../routes/paths';
import { useAppSelector } from '../../hooks';
import { selectUnreadConversationCount } from '../../features/messages/messagesSlice';
import { Badge } from '../ui/badge';

export default function BottomNav() {
  const location = useLocation();
  const unreadConversations = useAppSelector(selectUnreadConversationCount);

  const navItems = [
    { path: PATHS.FEED, icon: Home, label: 'Home' },
    { path: PATHS.COMMUNITY, icon: Users, label: 'Community' },
    { path: PATHS.CREATE_POST, icon: PlusCircle, label: 'Create' },
    { path: PATHS.INBOX, icon: Mail, label: 'Inbox', badge: unreadConversations },
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
                <div className="relative">
                  <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 text-xs bg-destructive text-destructive-foreground border-0">
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
