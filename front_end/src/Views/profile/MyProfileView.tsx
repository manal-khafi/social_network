import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { logoutUser } from "../../features/auth/authSlice";
import {
  fetchCurrentUserProfile,
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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../Components/ui/dropdown-menu";
import PostCard from "../../Components/post/PostCard";
import { toast } from "sonner";

export default function MyProfileView() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user: authUser, isAuthenticated } = useAppSelector((state) => state.auth);
  const { currentUser, followers, following, status: profileStatus } = useAppSelector(
    (state) => state.user
  );
  const { savedPosts, myPosts, status: postsStatus, error: postsError } = useAppSelector(
    (state) => state.posts
  );

  const user = currentUser ?? authUser;
  const displayName =
    user && typeof user === "object" && "display_name" in user
      ? (user as any).display_name
      : user?.username;
  const bio =
    user && typeof user === "object" && "bio" in user ? (user as any).bio : undefined;

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
    dispatch(logoutUser());
    navigate(PATHS.AUTH);
  };

  const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:3500").replace(/\/api$/, "");

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
        <p className="text-muted-foreground">Could not load user profile.</p>
        <Button onClick={() => dispatch(fetchCurrentUserProfile())} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const avatarUrl = (currentUser?.avatar_url ?? (authUser as any)?.avatar_url ?? null) as string | null;
  const coverImageRaw = (currentUser?.cover_image ?? (authUser as any)?.cover_image ?? null) as string | null;
  const coverImage = makeUrl(coverImageRaw);

  const handleToggleFollow = async (targetUserId: string, isPrivate: boolean) => {
    try {
      const result = await dispatch(toggleFollow(targetUserId)).unwrap();

      if (result.followRequestPending || (isPrivate && !result.isFollowing)) {
        toast.success("Follow request sent");
      } else if (result.isFollowing) {
        toast.success("Following user");
      } else {
        toast.success("Unfollowed user");
      }
    } catch (e: unknown) {
      toast.error(typeof e === "string" ? e : "Failed to update follow");
    }
  };

  const getButtonLabel = (u: (typeof followers)[number]) => {
    if (u.followRequestPending) return "Requested";
    if (u.isFollowing) return "Unfollow";
    return "Follow";
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
        displayName={displayName ?? user?.username ?? ""}
        username={user?.username ?? ""}
        bio={bio}
        actionsSlot={
          <>
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
                  <button className="flex items-center cursor-pointer w-full" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <div className="p-4">
        <div className="flex justify-around text-center border-t border-b border-border py-3 my-4">
          <div>
            <p className="font-semibold">{myPosts.length}</p>
            <p className="text-sm text-muted-foreground">Posts</p>
          </div>

          <button
            type="button"
            onClick={() => myUserId && setFollowersOpen(true)}
            className={myUserId ? "hover:underline" : "cursor-default pointer-events-none"}
          >
            <p className="font-semibold">{followers.length.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Followers</p>
          </button>

          <button
            type="button"
            onClick={() => myUserId && setFollowingOpen(true)}
            className={myUserId ? "hover:underline" : "cursor-default pointer-events-none"}
          >
            <p className="font-semibold">{following.length.toLocaleString()}</p>
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

      <Tabs defaultValue="posts" className="mt-4">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="posts" className="flex-1">
            Posts
          </TabsTrigger>
          <TabsTrigger value="reposts" className="flex-1">
            Reposts
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex-1">
            Saved
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
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          )}
          {postsStatus === "failed" && (
            <div className="text-center text-destructive py-8">{postsError}</div>
          )}
          {postsStatus === "succeeded" && savedPosts.length > 0 ? (
            savedPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <p className="text-center text-muted-foreground py-8">No saved posts</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
