import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { logoutUser } from '../../features/auth/authSlice';
import { fetchCurrentUserProfile } from '../../features/user/userSlice';
import { Edit, Settings, Menu, LogOut, Loader2 } from 'lucide-react';
import { Button } from '../../Components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../../Components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../Components/ui/tabs';
import { PATHS } from '../../routes/paths';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../Components/ui/dropdown-menu';
import PostCard from '../../Components/post/PostCard';

export default function MyProfileView() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user: authUser, isAuthenticated } = useAppSelector((state) => state.auth);
  const { currentUser, status: profileStatus, error: profileError } = useAppSelector((state) => state.user);
  const { feed, savedPosts, archivedPosts } = useAppSelector((state) => state.posts);
  
  useEffect(() => {
    // Fetch profile only if we are authenticated and the profile hasn't been fetched yet
    if (isAuthenticated && !currentUser && profileStatus === 'idle') {
      dispatch(fetchCurrentUserProfile());
    }
  }, [isAuthenticated, currentUser, profileStatus, dispatch]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate(PATHS.AUTH);
  };

  const user = currentUser ?? authUser;

  if (profileStatus === 'loading' && !user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Could not load user profile.</p>
        <Button onClick={() => dispatch(fetchCurrentUserProfile())} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  // The backend doesn't provide user posts yet, so this will be empty
  const userPosts = feed.filter(p => p.userId === user.id);

  return (
    <div>
      <div className="h-48 bg-muted" />

      <div className="p-4">
        <div className="flex items-end justify-between -mt-16 mb-4">
          <Avatar className="w-24 h-24 border-4 border-background">
            <AvatarImage src={user.avatar_url ?? user.avatar ?? undefined} />
            <AvatarFallback className="text-2xl">{(user?.username?.[0] ?? "?").toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex gap-2">
            <Link to={PATHS.PROFILE_EDIT}>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                  <Menu className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={PATHS.SETTINGS} className="flex items-center cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <button
                    className="flex items-center cursor-pointer w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h1 className="text-2xl font-bold">{user.display_name ?? user.username}</h1>
        <p className="text-muted-foreground">@{user.username}</p>
        {user.bio && <p className="mt-3">{user.bio}</p>}

        {/* Follower/Following counts are not available from the profile endpoint yet */}
        {/* <div className="flex gap-6 mt-4"> ... </div> */}
      </div>


      <Tabs defaultValue="posts" className="mt-4">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
          <TabsTrigger value="reposts" className="flex-1">Reposts</TabsTrigger>
          <TabsTrigger value="saved" className="flex-1">Saved</TabsTrigger>
          <TabsTrigger value="archived" className="flex-1">Archived</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="p-4 space-y-4">
            <p className="text-center text-muted-foreground py-8">Posts are not yet linked to user profiles.</p>
        </TabsContent>
        
        <TabsContent value="reposts" className="p-4 space-y-4">
            <p className="text-center text-muted-foreground py-8">Reposts are not yet implemented.</p>
        </TabsContent>
        
        <TabsContent value="saved" className="p-4 space-y-4">
          {savedPosts.length > 0 ? (
            savedPosts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <p className="text-center text-muted-foreground py-8">No saved posts</p>
          )}
        </TabsContent>

        <TabsContent value="archived" className="p-4 space-y-4">
          {archivedPosts.length > 0 ? (
            archivedPosts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <p className="text-center text-muted-foreground py-8">No archived posts</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
