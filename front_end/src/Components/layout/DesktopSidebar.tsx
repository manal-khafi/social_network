import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Home, Users, PlusCircle, Mail, User, Settings, LogOut, Heart, Search } from 'lucide-react';
import { useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { logoutUser } from '../../features/auth/authSlice';
import { PATHS } from '../../routes/paths';
import { Skeleton } from '../ui/skeleton';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

export default function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.user);
  const { user: authUser } = useAppSelector((state) => state.auth);
  const { unreadCount } = useAppSelector((state) => state.notifications);
  const inboxUnreadTotal = useAppSelector((state) => state.messages.unreadTotal);
  const logoUrl = new URL('../../../logo.png', import.meta.url).href;

  // Use detailed profile if available, otherwise fallback to basic auth user
  const user = currentUser ?? authUser;

  const avatarSrc = useMemo(() => {
    if (!user || typeof user !== "object") return undefined;
    if ("avatar_url" in user && typeof user.avatar_url === "string") return user.avatar_url;
    if ("avatar" in user && typeof user.avatar === "string") return user.avatar;
    return undefined;
  }, [user]);

  const displayName = useMemo(() => {
    if (!user || typeof user !== "object") return "";
    if ("display_name" in user && typeof user.display_name === "string") return user.display_name;
    if ("fullName" in user && typeof user.fullName === "string") return user.fullName;
    return user.username ?? "";
  }, [user]);

  const followersCount = useMemo(() => {
    if (!user || typeof user !== "object") return 0;
    return "followersCount" in user ? Number((user as any).followersCount ?? 0) : 0;
  }, [user]);

  const followingCount = useMemo(() => {
    if (!user || typeof user !== "object") return 0;
    return "followingCount" in user ? Number((user as any).followingCount ?? 0) : 0;
  }, [user]);

  const navItems = [
    { path: PATHS.FEED, icon: Home, label: 'Home' },
    { path: PATHS.COMMUNITY, icon: Users, label: 'Community' },
    { path: PATHS.CREATE_POST, icon: PlusCircle, label: 'Create' },
    { path: PATHS.INBOX, icon: Mail, label: 'Inbox', badge: inboxUnreadTotal },
    { path: PATHS.NOTIFICATIONS, icon: Heart, label: 'Notifications', badge: unreadCount },
    { path: PATHS.PROFILE_ME, icon: User, label: 'Profile' },
  ];

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const isSearchPage = location.pathname.startsWith(PATHS.SEARCH);
  const query = isSearchPage ? searchParams.get("q") ?? "" : "";

  const handleSearchChange = (value: string) => {
    if (!isSearchPage) {
      navigate(`${PATHS.SEARCH}?q=${encodeURIComponent(value)}`);
      return;
    }
    if (!value.trim()) {
      setSearchParams({});
      return;
    }
    setSearchParams({ q: value });
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
              <AvatarImage src={avatarSrc} />
              <AvatarFallback>{(user.username?.[0] ?? '?').toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{displayName || user.username}</p>
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

      {/* Search Bar */}
      <div className="hidden p-3 group-hover:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onFocus={() => {
              if (!isSearchPage) navigate(PATHS.SEARCH);
            }}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search"
            className="h-9 rounded-full pl-9 bg-muted/60 border-none focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-3 group-hover:p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            const badge = item.badge ?? 0;

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
                <div className="relative">
                  <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                  {badge > 0 && (
                     <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 text-xs bg-destructive text-destructive-foreground border-0">
                       {badge > 9 ? '9+' : badge}
                     </Badge>
                  )}
                </div>
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
            <span>{followersCount.toLocaleString()} Followers</span>
            <span>{followingCount.toLocaleString()} Following</span>
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
