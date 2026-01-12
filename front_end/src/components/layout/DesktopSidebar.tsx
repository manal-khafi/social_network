import { Link, useLocation } from 'react-router-dom';
import { Home, Users, PlusCircle, Mail, User, X, Settings, LogOut } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { logout } from '../../features/auth/authSlice';

interface DesktopSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DesktopSidebar({ isOpen, onClose }: DesktopSidebarProps) {
  const location = useLocation();
  const { currentUser } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/community', icon: Users, label: 'Community' },
    { path: '/create-post', icon: PlusCircle, label: 'Create' },
    { path: '/inbox', icon: Mail, label: 'Inbox' },
    { path: '/profile/me', icon: User, label: 'Profile' },
  ];

  const handleLogout = () => {
    dispatch(logout());
    onClose();
  };

  if (!currentUser) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="hidden lg:block fixed inset-0 bg-black/50 z-50"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 h-full w-80 bg-card border-r border-border z-50 flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm text-primary-foreground font-bold">A</span>
            </div>
            <h1 className="text-lg font-bold text-foreground">ANMOUGAR</h1>
          </Link>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Section */}
        <Link
          to="/profile/me"
          className="p-4 border-b border-border hover:bg-muted transition-colors"
          onClick={onClose}
        >
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback>{currentUser.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{currentUser.fullName}</p>
              <p className="text-sm text-muted-foreground truncate">@{currentUser.username}</p>
            </div>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Settings and Logout Section */}
          <div className="mt-6 pt-6 border-t border-border space-y-2">
            <Link
              to="/settings"
              onClick={onClose}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                location.pathname.startsWith('/settings')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <Settings className={`w-6 h-6 ${location.pathname.startsWith('/settings') ? 'fill-current' : ''}`} />
              <span className="font-medium">Settings</span>
            </Link>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all hover:bg-muted text-foreground"
            >
              <LogOut className="w-6 h-6" />
              <span className="font-medium">Log out</span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{currentUser.followersCount.toLocaleString()} Followers</span>
            <span>{currentUser.followingCount.toLocaleString()} Following</span>
          </div>
        </div>
      </aside>
    </>
  );
}