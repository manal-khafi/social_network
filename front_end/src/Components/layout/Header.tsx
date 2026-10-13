import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Search } from 'lucide-react';
import { useAppSelector } from '../../hooks';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { PATHS } from '../../routes/paths';
import { LogoIcon } from '../ui/LogoIcon';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { unreadCount } = useAppSelector((state) => state.notifications);
  
  // Don't show header on certain pages
  const hideHeader = [PATHS.CREATE_POST, '/home/story/', PATHS.INBOX].some(path => 
    location.pathname.startsWith(path)
  );

  if (hideHeader) return null;

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
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border lg:hidden">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
        <Link to={PATHS.HOME} className="flex items-center gap-2 shrink-0 font-semibold text-lg tracking-tight">
          <LogoIcon size={28} />
          Anmouggar
        </Link>

        <div className="flex-1">
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

        <Link to={PATHS.NOTIFICATIONS} className="relative p-2 hover:bg-muted rounded-full transition-colors">
          <Heart className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 text-xs bg-destructive text-destructive-foreground border-0">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Link>
      </div>
    </header>
  );
}
