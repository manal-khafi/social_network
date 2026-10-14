import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { logoutUser } from "../../features/auth/authSlice";
import {
  fetchCurrentUserProfile,
  selectMyAvatar,
  fetchFollowers,
  fetchFollowing,
  toggleFollow,
} from "../../features/user/userSlice";
import { fetchSavedPosts, fetchMyPosts } from "../../features/posts/postsSlice";
import { Edit, Settings, Menu, LogOut, Loader2 } from "lucide-react";
import { Button } from "../../Components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../Components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../Components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../../Components/ui/avatar";
import { Card } from "../../Components/ui/card";
import { PATHS } from "../../routes/paths";
import MyPostsView from "./MyPostsView";
import MyRepostsView from "./MyRepostsView";
import ProfileHeaderLayout from "../../Components/Profile/ProfileHeaderLayout";
import HighlightsBar from "../../Components/story/HighlightsBar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../Components/ui/dropdown-menu";
import PostCard from "../../Components/post/PostCard";
import { toast } from "sonner";
import { API_ORIGIN } from "../../api/axios";
import { useTranslation } from "react-i18next";

export default function MyProfileView() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { user: authUser, isAuthenticated, isLoggingOut } = useAppSelector((state) => state.auth);
  const myAvatar = useAppSelector(selectMyAvatar);
  const { currentUser, followers, following, status: profileStatus } = useAppSelector(
    (state) => state.user
  );
  const { savedPosts, myPosts, status: postsStatus, error: postsError } = useAppSelector(
    (state) => state.posts
  );

  // ✅ My real user id (used for followers/following routes)
  const myUserId = currentUser?.id ?? authUser?.id ?? null;
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCurrentUserProfile());
      dispatch(fetchSavedPosts());
      dispatch(fetchMyPosts());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      dispatch(fetchFollowers(currentUser.id));
      dispatch(fetchFollowing(currentUser.id));
    }
  }, [isAuthenticated, currentUser?.id, dispatch]);

  useEffect(() => {
    if (followersOpen && currentUser?.id) {
      dispatch(fetchFollowers(currentUser.id));
    }
  }, [dispatch, followersOpen, currentUser?.id]);

  useEffect(() => {
    if (followingOpen && currentUser?.id) {
      dispatch(fetchFollowing(currentUser.id));
    }
  }, [dispatch, followingOpen, currentUser?.id]);

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => navigate(PATHS.AUTH, { replace: true }));
  };

  const user = currentUser ?? authUser;

  const makeUrl = (url?: string | null) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  if (profileStatus === "loading" && !user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">{t("profile.loadFailed")}</p>
        <Button onClick={() => dispatch(fetchCurrentUserProfile())} className="mt-4">
          {t("actions.retry")}
        </Button>
      </div>
    );
  }

  const avatarUrl = myAvatar ?? null;
  const coverImageRaw = (currentUser?.cover_image ?? (authUser as any)?.cover_image ?? null) as string | null;
  const coverImage = makeUrl(coverImageRaw);

  const handleToggleFollow = async (targetUserId: string, isPrivate: boolean) => {
    try {
      const result = await dispatch(toggleFollow(targetUserId)).unwrap();

      if (result.followRequestPending || (isPrivate && !result.isFollowing)) {
        toast.success(t("profile.followRequestSent"));
      } else if (result.isFollowing) {
        toast.success(t("profile.followingUser"));
      } else {
        toast.success(t("profile.unfollowedUser"));
      }
    } catch (e: unknown) {
      toast.error(typeof e === "string" ? e : t("profile.followUpdateFailed"));
    }
  };

  const getButtonLabel = (u: (typeof followers)[number]) => {
    if (u.followRequestPending) return t("profile.requested");
    if (u.isFollowing) return t("profile.unfollow");
    return t("profile.follow");
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
                    variant={person.isFollowing ? "outline" : "default"}
                    className={!person.isFollowing ? "bg-[#d6955b] hover:bg-[#c58549]" : ""}
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

  return (
    <div>
      <ProfileHeaderLayout
        coverImage={coverImage}
        avatarUrl={avatarUrl}
        displayName={user.display_name ?? user.username}
        username={user.username}
        bio={user.bio}
        actionsSlot={
          <>
            <Link to={PATHS.PROFILE_EDIT}>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 me-2" />
                {t("profile.editProfile")}
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
                    <Settings className="w-4 h-4 me-2" />
                    {t("nav.settings")}
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <button
                    className="flex items-center cursor-pointer w-full disabled:opacity-50"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="w-4 h-4 me-2" />
                    {t("settings.logout")}
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <div className="p-4">
        <div className="grid grid-cols-3 gap-2 text-center border-t border-b border-border py-3 my-4">
          <div className="min-w-0">
            <p className="font-semibold">{myPosts.length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("profile.posts")}</p>
          </div>

          <button
            type="button"
            onClick={() => myUserId && setFollowersOpen(true)}
            className={`min-w-0 ${myUserId ? "hover:underline" : "cursor-default pointer-events-none"}`}
          >
            <p className="font-semibold">{followers.length.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("profile.followers")}</p>
          </button>

          <button
            type="button"
            onClick={() => myUserId && setFollowingOpen(true)}
            className={`min-w-0 ${myUserId ? "hover:underline" : "cursor-default pointer-events-none"}`}
          >
            <p className="font-semibold">{following.length.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("profile.following")}</p>
          </button>
        </div>
      </div>

      <Dialog open={followersOpen} onOpenChange={setFollowersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profile.followers")}</DialogTitle>
          </DialogHeader>
          {renderFollowList(followers, t("empty.followers"))}
        </DialogContent>
      </Dialog>

      <Dialog open={followingOpen} onOpenChange={setFollowingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profile.following")}</DialogTitle>
          </DialogHeader>
          {renderFollowList(following, t("empty.following"))}
        </DialogContent>
      </Dialog>
      {myUserId && <HighlightsBar userId={myUserId} />}

      <Tabs defaultValue="posts" className="mt-4">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="posts" className="flex-1 min-w-0 px-1 text-xs sm:text-sm">
            {t("profile.posts")}
          </TabsTrigger>
          <TabsTrigger value="reposts" className="flex-1 min-w-0 px-1 text-xs sm:text-sm">
            {t("profile.reposts")}
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex-1 min-w-0 px-1 text-xs sm:text-sm">
            {t("profile.saved")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="p-4">
          <MyPostsView />
        </TabsContent>

        <TabsContent value="reposts" className="p-4 space-y-4">
          <MyRepostsView />
        </TabsContent>

        <TabsContent value="saved" className="p-4 space-y-4">
          {postsStatus === "loading" && (
            <div className="text-center text-muted-foreground py-8">{t("actions.loading")}</div>
          )}
          {postsStatus === "failed" && (
            <div className="text-center text-destructive py-8">{postsError}</div>
          )}
          {postsStatus === "succeeded" && savedPosts.length > 0 ? (
            savedPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <p className="text-center text-muted-foreground py-8">{t("empty.savedPosts")}</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
