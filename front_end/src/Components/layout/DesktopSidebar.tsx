import { Link, useLocation } from 'react-router-dom';
import { Home, Users, PlusCircle, Mail, User, Settings, LogOut } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { logoutUser } from '../../features/auth/authSlice';
import { PATHS } from '../../routes/paths';
import { Skeleton } from '../ui/skeleton';

export default function DesktopSidebar() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.user);
  const { user: authUser } = useAppSelector((state) => state.auth);
  const logoUrl = new URL('../../../logo.png', import.meta.url).href;

  // Use detailed profile if available, otherwise fallback to basic auth user
  const user = currentUser ?? authUser;

  const navItems = [
    { path: PATHS.FEED, icon: Home, label: 'Home' },
    { path: PATHS.COMMUNITY, icon: Users, label: 'Community' },
    { path: PATHS.CREATE_POST, icon: PlusCircle, label: 'Create' },
    { path: PATHS.INBOX, icon: Mail, label: 'Inbox' },
    { path: PATHS.PROFILE_ME, icon: User, label: 'Profile' },
  ];

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <aside
      className="group hidden lg:flex h-screen w-20 flex-col border-r border-border bg-card sticky top-0 transition-all duration-200 hover:w-80"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-center group-hover:justify-between">
        <Link to={PATHS.HOME} className="flex items-center gap-2">
          <img src={logoUrl} alt="ANMOUGAR logo" className="w-8 h-8 rounded-full object-cover" />
          <h1 className="hidden text-lg font-bold text-foreground group-hover:block">ANMOUGAR</h1>
        </Link>
      </div>

      {/* User Profile Section */}
      {user ? (
        <Link
          to={PATHS.PROFILE_ME}
          className="hidden p-4 border-b border-border hover:bg-muted transition-colors group-hover:block"
        >
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.avatar_url ?? user.avatar ?? undefined} />
              <AvatarFallback>{(user.username?.[0] ?? '?').toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{user.display_name ?? user.username}</p>
              <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
            </div>
          </div>
        </Link>
      ) : (
        <div className="hidden p-4 border-b border-border group-hover:block">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      )}


      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-3 group-hover:p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`flex items-center justify-center px-2 py-3 rounded-lg transition-all group-hover:justify-start group-hover:gap-4 group-hover:px-4 ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                <span className="hidden font-medium group-hover:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Settings and Logout Section */}
        <div className="mt-6 pt-6 border-t border-border space-y-2">
          <Link
            to={PATHS.SETTINGS}
            title="Settings"
            className={`flex items-center justify-center px-2 py-3 rounded-lg transition-all group-hover:justify-start group-hover:gap-4 group-hover:px-4 ${
              location.pathname.startsWith(PATHS.SETTINGS)
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-foreground'
            }`}
          >
            <Settings className={`w-6 h-6 ${location.pathname.startsWith(PATHS.SETTINGS) ? 'fill-current' : ''}`} />
            <span className="hidden font-medium group-hover:inline">Settings</span>
          </Link>

          <button
            onClick={handleLogout}
            title="Log out"
            className="w-full flex items-center justify-center px-2 py-3 rounded-lg transition-all hover:bg-muted text-foreground group-hover:justify-start group-hover:gap-4 group-hover:px-4"
          >
            <LogOut className="w-6 h-6" />
            <span className="hidden font-medium group-hover:inline">Log out</span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="hidden p-4 border-t border-border group-hover:block">
        {user ? (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{Number(user.followersCount ?? 0).toLocaleString()} Followers</span>
            <span>{Number(user.followingCount ?? 0).toLocaleString()} Following</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-2/5" />
          </div>
        )}
      </div>
    </aside>
  );
}
