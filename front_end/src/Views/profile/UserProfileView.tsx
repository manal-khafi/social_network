import { useParams, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { toggleFollow } from '../../features/user/userSlice';
import { MessageCircle, Lock } from 'lucide-react';
import { Button } from '../../Componenets/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../../Componenets/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../Componenets/ui/tabs';
import { toast } from 'sonner';
import PostCard from '../../Componenets/post/PostCard';

export default function UserProfileView() {
  const { userId } = useParams();
  const dispatch = useAppDispatch();
  const { suggestedUsers } = useAppSelector((state) => state.user);
  const { feed } = useAppSelector((state) => state.posts);
  
  const user = suggestedUsers.find(u => u.id === userId);
  
  if (!user) return <div className="p-4">User not found</div>;

  const userPosts = feed.filter(p => p.userId === userId && !p.originalPost);
  const userReposts = feed.filter(p => p.userId === userId && p.originalPost);

  const handleFollowClick = () => {
    dispatch(toggleFollow(userId!));
    
    if (!user.isPublic && !user.isFollowing && !user.followRequestPending) {
      toast.success('Follow request sent');
    } else if (user.followRequestPending) {
      toast.info('Follow request already sent');
    }
  };

  const getFollowButtonText = () => {
    if (user.isFollowing) return 'Following';
    if (user.followRequestPending) return 'Requested';
    return 'Follow';
  };

  const canViewPosts = user.isPublic || user.isFollowing;

  return (
    <div>
      <div className="p-4">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-xl">{user.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{user.fullName}</h1>
              {!user.isPublic && <Lock className="w-4 h-4 text-muted-foreground" />}
            </div>
            <p className="text-muted-foreground">@{user.username}</p>
          </div>
        </div>

        <p className="mb-4">{user.bio}</p>

        <div className="flex gap-6 mb-4">
          <div>
            <span className="font-semibold">{user.followersCount.toLocaleString()}</span>{' '}
            <span className="text-muted-foreground">Followers</span>
          </div>
          <div>
            <span className="font-semibold">{user.followingCount.toLocaleString()}</span>{' '}
            <span className="text-muted-foreground">Following</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleFollowClick}
            variant={user.isFollowing ? 'outline' : 'default'}
            className={`flex-1 ${user.isFollowing || user.followRequestPending ? '' : 'bg-[#d6955b] hover:bg-[#c58549]'}`}
            disabled={user.followRequestPending}
          >
            {getFollowButtonText()}
          </Button>
          <Link to={`/inbox/${userId}`} className="flex-1">
            <Button variant="outline" className="w-full">
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="posts" className="mt-4">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
          <TabsTrigger value="reposts" className="flex-1">Reposts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="p-4 space-y-4">
          {canViewPosts ? (
            userPosts.length > 0 ? (
              userPosts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <p className="text-center text-muted-foreground py-8">No posts yet</p>
            )
          ) : (
            <div className="text-center py-12">
              <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-semibold mb-1">This Account is Private</p>
              <p className="text-sm text-muted-foreground">
                Follow this account to see their posts
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="reposts" className="p-4 space-y-4">
          {canViewPosts ? (
            userReposts.length > 0 ? (
              userReposts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <p className="text-center text-muted-foreground py-8">No reposts yet</p>
            )
          ) : (
            <div className="text-center py-12">
              <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-semibold mb-1">This Account is Private</p>
              <p className="text-sm text-muted-foreground">
                Follow this account to see their reposts
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}