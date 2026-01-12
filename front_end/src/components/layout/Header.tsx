import { Link, useLocation } from 'react-router-dom';
import { Bell, Search, Menu } from 'lucide-react';
import { useAppSelector } from '../../hooks';
import { Badge } from '../ui/badge';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation();
  const { unreadCount } = useAppSelector((state) => state.notifications);
  
  // Don't show header on certain pages
  const hideHeader = ['/create-post', '/story/', '/inbox/'].some(path => 
    location.pathname.includes(path)
  );

  if (hideHeader) return null;

  return (
    <header className="sticky top-0 bg-card border-b border-border z-40">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Desktop Burger Menu */}
          <button
            onClick={onMenuToggle}
            className="hidden lg:block p-2 hover:bg-muted rounded-full transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm text-primary-foreground font-bold">A</span>
            </div>
            <h1 className="text-lg font-bold text-foreground">ANMOUGAR</h1>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <Search className="w-5 h-5 text-foreground" />
          </button>
          
          <Link to="/notifications" className="relative p-2 hover:bg-muted rounded-full transition-colors">
            <Bell className="w-5 h-5 text-foreground" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 text-xs bg-destructive text-destructive-foreground border-0">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}