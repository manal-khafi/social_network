import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { fetchUserProfile, toggleFollow, fetchFollowers, fetchFollowing } from '../../features/user/userSlice';
import { fetchUserPosts, fetchUserReposts } from '../../features/posts/postsSlice';
import { MessageCircle, Lock } from 'lucide-react';
import { Button } from '../../Components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../Components/ui/tabs';
import { toast } from 'sonner';
import PostCard from '../../Components/post/PostCard';
import ProfileHeaderLayout from '../../Components/Profile/ProfileHeaderLayout';
import HighlightsBar from '../../Components/story/HighlightsBar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../Components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../../Components/ui/avatar';
import { Card } from '../../Components/ui/card';

export default function UserProfileView() {
  const { userId: username } = useParams();
  const dispatch = useAppDispatch();
  const { viewedUser: user, status, followers, following } = useAppSelector((state) => state.user);
  const { userPosts, userReposts } = useAppSelector((state) => state.posts);
  const authUser = useAppSelector((state) => state.auth.user);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

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

  useEffect(() => {
    if (followersOpen && user?.id) {
      dispatch(fetchFollowers(user.id));
    }
  }, [dispatch, followersOpen, user?.id]);

  useEffect(() => {
    if (followingOpen && user?.id) {
      dispatch(fetchFollowing(user.id));
    }
  }, [dispatch, followingOpen, user?.id]);

  if (status === 'loading' && !user) {
    return <div className="p-4">Loading...</div>;
  }

  if (!user) return <div className="p-4">User not available</div>;
  
  const myUserId = authUser?.id;
  const isMe = myUserId && user.id === myUserId;

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

  const handleToggleFollow = async (targetUserId: string, isPrivate: boolean) => {
    try {
      const result = await dispatch(toggleFollow(targetUserId)).unwrap();
      if (result.followRequestPending || (isPrivate && !result.isFollowing)) {
        toast.success('Follow request sent');
      } else if (result.isFollowing) {
        toast.success('Following user');
      } else {
        toast.success('Unfollowed user');
      }
    } catch (e: unknown) {
      toast.error(typeof e === 'string' ? e : 'Failed to update follow');
    }
  };

  const getButtonLabel = (u: (typeof followers)[number]) => {
    if (u.followRequestPending) return 'Requested';
    if (u.isFollowing) return 'Unfollow';
    return 'Follow';
  };

  const isDisabled = (u: (typeof followers)[number]) => !!u.followRequestPending;

  const renderFollowList = (
    list: typeof followers,
    emptyText: string
  ) => (
    <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">{emptyText}</p>
      ) : (
        list.map((person) => {
          const isMe = myUserId && person.id === myUserId;
          return (
            <Card key={person.id} className="p-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={person.avatar_url ?? undefined} />
                  <AvatarFallback>{person.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{person.display_name ?? person.username}</p>
                  <p className="text-sm text-muted-foreground truncate">@{person.username}</p>
                </div>
                {!isMe && (
                  <Button
                    size="sm"
                    variant={person.isFollowing ? 'outline' : 'default'}
                    className={!person.isFollowing ? 'bg-[#d6955b] hover:bg-[#c58549]' : ''}
                    disabled={isDisabled(person)}
                    onClick={() => handleToggleFollow(person.id, !!person.is_private)}
                  >
                    {getButtonLabel(person)}
                  </Button>
                )}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );

  const canViewPosts = !!user.canViewPosts;
  const followersCount = user.followersCount ?? 0;
  const followingCount = user.followingCount ?? 0;

  const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:3500").replace(/\/api$/, "");
  const makeUrl = (url?: string | null) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const coverImage = makeUrl(user.cover_image);

  return (
    <div>
      <ProfileHeaderLayout
        coverImage={coverImage}
        avatarUrl={user.avatar_url}
        displayName={user.display_name}
        username={user.username}
        bio={user.bio}
        actionsSlot={
          isMe ? (
            <Link to="/home/settings/profile" className="w-full">
              <Button variant="outline" className="w-full">
                Edit Profile
              </Button>
            </Link>
          ) : (
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
          )
        }
      />

      <div className="p-4">
        <div className="flex justify-around text-center border-t border-b border-border py-3 my-4">
          <div>
            <p className="font-semibold">{posts.length}</p>
            <p className="text-sm text-muted-foreground">Posts</p>
          </div>
          <button type="button" onClick={() => setFollowersOpen(true)} className="hover:underline">
            <p className="font-semibold">{followersCount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Followers</p>
          </button>
          <button type="button" onClick={() => setFollowingOpen(true)} className="hover:underline">
            <p className="font-semibold">{followingCount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Following</p>
          </button>
        </div>
      </div>

      <Dialog open={followersOpen} onOpenChange={setFollowersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
          </DialogHeader>
          {renderFollowList(followers, "No followers yet")}
        </DialogContent>
      </Dialog>

      <Dialog open={followingOpen} onOpenChange={setFollowingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
          </DialogHeader>
          {renderFollowList(following, "Not following anyone yet")}
        </DialogContent>
      </Dialog>
      {user?.id && <HighlightsBar userId={user.id} />}

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
