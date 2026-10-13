import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { fetchUserProfile, toggleFollow, fetchFollowers, fetchFollowing } from '../../features/user/userSlice';
import { fetchUserPosts, fetchUserReposts } from '../../features/posts/postsSlice';
import { MessageCircle, Lock, Phone } from 'lucide-react';
import { useCall } from '../../features/call/CallProvider';
import { Button } from '../../Components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../Components/ui/tabs';
import { toast } from 'sonner';
import { API_ORIGIN } from '../../api/axios';
import { useTranslation } from 'react-i18next';
import PostCard from '../../Components/post/PostCard';
import ProfileHeaderLayout from '../../Components/Profile/ProfileHeaderLayout';
import HighlightsBar from '../../Components/story/HighlightsBar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../Components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../../Components/ui/avatar';
import { Card } from '../../Components/ui/card';

export default function UserProfileView() {
  const { userId: username } = useParams();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { startCall } = useCall();
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
    return <div className="p-4">{t('actions.loading')}</div>;
  }

  if (!user) return <div className="p-4">{t('profile.userNotAvailable')}</div>;
  
  const myUserId = authUser?.id;
  const isMe = myUserId && user.id === myUserId;

  const posts = userPosts[user.id] ?? [];
  const reposts = userReposts[user.id] ?? [];

  const handleFollowClick = () => {
    dispatch(toggleFollow(user.id));
    
    if (user.is_private && !user.isFollowing && !user.followRequestPending) {
      toast.success(t('profile.followRequestSent'));
    } else if (user.followRequestPending) {
      toast.info(t('profile.followRequestAlreadySent'));
    }
  };

  const getFollowButtonText = () => {
    if (user.isFollowing) return t('profile.followingButton');
    if (user.followRequestPending) return t('profile.requested');
    return t('profile.follow');
  };

  const handleToggleFollow = async (targetUserId: string, isPrivate: boolean) => {
    try {
      const result = await dispatch(toggleFollow(targetUserId)).unwrap();
      if (result.followRequestPending || (isPrivate && !result.isFollowing)) {
        toast.success(t('profile.followRequestSent'));
      } else if (result.isFollowing) {
        toast.success(t('profile.followingUser'));
      } else {
        toast.success(t('profile.unfollowedUser'));
      }
    } catch (e: unknown) {
      toast.error(typeof e === 'string' ? e : t('profile.followUpdateFailed'));
    }
  };

  const getButtonLabel = (u: (typeof followers)[number]) => {
    if (u.followRequestPending) return t('profile.requested');
    if (u.isFollowing) return t('profile.unfollow');
    return t('profile.follow');
  };

  const isDisabled = (u: (typeof followers)[number]) => !!u.followRequestPending;

  const renderFollowList = (
    list: typeof followers,
    emptyText: string
  ) => (
    <div className="max-h-[60vh] space-y-2 overflow-y-auto pe-1">
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
                {t('profile.editProfile')}
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
                  <MessageCircle className="w-4 h-4 me-2" />
                  {t('profile.message')}
                </Button>
              </Link>
              <Button
                variant="outline"
                size="icon"
                aria-label={t('profile.call')}
                onClick={() =>
                  startCall(
                    { id: user.id, username: user.username, avatar: user.avatar_url ?? undefined },
                    'audio'
                  )
                }
              >
                <Phone className="w-4 h-4" />
              </Button>
            </>
          )
        }
      />

      <div className="p-4">
        <div className="flex justify-around text-center border-t border-b border-border py-3 my-4">
          <div>
            <p className="font-semibold">{posts.length}</p>
            <p className="text-sm text-muted-foreground">{t('profile.posts')}</p>
          </div>
          <button type="button" onClick={() => setFollowersOpen(true)} className="hover:underline">
            <p className="font-semibold">{followersCount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{t('profile.followers')}</p>
          </button>
          <button type="button" onClick={() => setFollowingOpen(true)} className="hover:underline">
            <p className="font-semibold">{followingCount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{t('profile.following')}</p>
          </button>
        </div>
      </div>

      <Dialog open={followersOpen} onOpenChange={setFollowersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('profile.followers')}</DialogTitle>
          </DialogHeader>
          {renderFollowList(followers, t('empty.followers'))}
        </DialogContent>
      </Dialog>

      <Dialog open={followingOpen} onOpenChange={setFollowingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('profile.following')}</DialogTitle>
          </DialogHeader>
          {renderFollowList(following, t('empty.following'))}
        </DialogContent>
      </Dialog>
      {user?.id && <HighlightsBar userId={user.id} />}

      <Tabs defaultValue="posts" className="mt-4">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="posts" className="flex-1">{t('profile.posts')}</TabsTrigger>
          <TabsTrigger value="reposts" className="flex-1">{t('profile.reposts')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="p-4 space-y-4">
          {canViewPosts ? (
            posts.length > 0 ? (
              posts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <p className="text-center text-muted-foreground py-8">{t('empty.feed')}</p>
            )
          ) : (
            <div className="text-center py-12">
              <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-semibold mb-1">{t('profile.privateAccount')}</p>
              <p className="text-sm text-muted-foreground">
                {t('profile.followToSee')}
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="reposts" className="p-4 space-y-4">
          {canViewPosts ? (
            reposts.length > 0 ? (
              reposts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <p className="text-center text-muted-foreground py-8">{t('empty.reposts')}</p>
            )
          ) : (
            <div className="text-center py-12">
              <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-semibold mb-1">{t('profile.privateAccount')}</p>
              <p className="text-sm text-muted-foreground">
                {t('profile.followToSeeReposts')}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
