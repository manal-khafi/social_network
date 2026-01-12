import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { logout } from '../../features/auth/authSlice';
import { Edit, Settings, Menu, LogOut} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import PostCard from '../../components/post/PostCard';

export default function MyProfileView() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentUser } = useAppSelector((state) => state.user);
  const { feed, savedPosts, archivedPosts } = useAppSelector((state) => state.posts);
  
  if (!currentUser) return null;

  const userPosts = feed.filter(p => p.userId === currentUser.id);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div>
      {currentUser.coverImage && (
        <div className="h-48 bg-muted">
          <img
            src={currentUser.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-end justify-between -mt-16 mb-4">
          <Avatar className="w-24 h-24 border-4 border-background">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback className="text-2xl">{currentUser.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex gap-2">
            <Link to="/profile/edit">
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
                  <Link to="/settings" className="flex items-center cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <button
                    className="flex items-center cursor-pointer"
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

        <h1 className="text-2xl font-bold">{currentUser.fullName}</h1>
        <p className="text-muted-foreground">@{currentUser.username}</p>
        <p className="mt-3">{currentUser.bio}</p>

        <div className="flex gap-6 mt-4">
          <Link to="/profile/me/followers" className="hover:underline">
            <span className="font-semibold">{currentUser.followersCount.toLocaleString()}</span>{' '}
            <span className="text-muted-foreground">Followers</span>
          </Link>
          <Link to="/profile/me/following" className="hover:underline">
            <span className="font-semibold">{currentUser.followingCount.toLocaleString()}</span>{' '}
            <span className="text-muted-foreground">Following</span>
          </Link>
        </div>
      </div>


      <Tabs defaultValue="posts" className="mt-4">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
          <TabsTrigger value="reposts" className="flex-1">Reposts</TabsTrigger>
          <TabsTrigger value="saved" className="flex-1">Saved</TabsTrigger>
          <TabsTrigger value="archived" className="flex-1">Archived</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="p-4 space-y-4">
          {userPosts.filter(p => !p.originalPost).length > 0 ? (
            userPosts.filter(p => !p.originalPost).map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <p className="text-center text-muted-foreground py-8">No posts yet</p>
          )}
        </TabsContent>
        
        <TabsContent value="reposts" className="p-4 space-y-4">
          {userPosts.filter(p => p.originalPost).length > 0 ? (
            userPosts.filter(p => p.originalPost).map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <p className="text-center text-muted-foreground py-8">No reposts yet</p>
          )}
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