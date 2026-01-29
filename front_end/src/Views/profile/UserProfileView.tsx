import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { fetchUserProfile, toggleFollow } from '../../features/user/userSlice';
import { fetchUserPosts, fetchUserReposts } from '../../features/posts/postsSlice';
import { Edit, MessageCircle, Lock } from 'lucide-react';
import { Button } from '../../Components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../../Components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../Components/ui/tabs';
import { toast } from 'sonner';
import PostCard from '../../Components/post/PostCard';

export default function UserProfileView() {
  const { userId: username } = useParams();
  const dispatch = useAppDispatch();
  const { viewedUser: user, status } = useAppSelector((state) => state.user);
  const { userPosts, userReposts } = useAppSelector((state) => state.posts);
  const authUser = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (username) {
      dispatch(fetchUserProfile(username));
    }
  }, [dispatch, username]);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserPosts(user.id));
      dispatch(fetchUserReposts(user.id));
    }
  }, [dispatch, user?.id]);

  if (status === 'loading' && !user) {
    return <div className="p-4">Loading...</div>;
  }

  if (!user) return <div className="p-4">User not available</div>;

  const posts = userPosts[user.id] ?? [];
  const reposts = userReposts[user.id] ?? [];

  const handleFollowClick = () => {
    dispatch(toggleFollow(user.id));
    
    if (user.is_private && !user.isFollowing && !user.followRequestPending) {
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

  const canViewPosts = !!user.canViewPosts;
  const followersCount = user.followersCount ?? 0;
  const followingCount = user.followingCount ?? 0;
  const isSelf = !!authUser && authUser.id === user.id;

  return (
    <div>
      <div className="p-4">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={user.avatar_url ?? undefined} />
            <AvatarFallback className="text-xl">
              {(user.username?.[0] || '?').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{user.display_name}</h1>
              {user.is_private && <Lock className="w-4 h-4 text-muted-foreground" />}
            </div>
            <p className="text-muted-foreground">@{user.username}</p>
          </div>
        </div>

        <p className="mb-4">{user.bio}</p>

        <div className="flex gap-6 mb-4">
          <Link to={`/home/profile/${user.id}/followers`} className="hover:underline">
            <span className="font-semibold">{followersCount.toLocaleString()}</span>{' '}
            <span className="text-muted-foreground">Followers</span>
          </Link>
          <Link to={`/home/profile/${user.id}/following`} className="hover:underline">
            <span className="font-semibold">{followingCount.toLocaleString()}</span>{' '}
            <span className="text-muted-foreground">Following</span>
          </Link>
        </div>

        <div className="flex gap-2">
          {!isSelf && (
            <>
              <Button
                onClick={handleFollowClick}
                variant={user.isFollowing ? 'outline' : 'default'}
                className={`flex-1 ${user.isFollowing || user.followRequestPending ? '' : 'bg-[#d6955b] hover:bg-[#c58549]'}`}
                disabled={user.followRequestPending}
              >
                {getFollowButtonText()}
              </Button>
              <Link to={`/home/inbox/${user.id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </Link>
            </>
          )}
          {isSelf && (
            <Link to="/home/profile/edit" className="flex-1">
              <Button variant="outline" className="w-full">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Tabs defaultValue="posts" className="mt-4">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
          <TabsTrigger value="reposts" className="flex-1">Reposts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="p-4 space-y-4">
          {canViewPosts ? (
            posts.length > 0 ? (
              posts.map(post => <PostCard key={post.id} post={post} />)
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
            reposts.length > 0 ? (
              reposts.map(post => <PostCard key={post.id} post={post} />)
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
