import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { logoutUser } from "../../features/auth/authSlice";
import {
  fetchCurrentUserProfile,
  fetchFollowers,
  fetchFollowing,
} from "../../features/user/userSlice";
import { fetchSavedPosts, fetchMyPosts } from "../../features/posts/postsSlice";
import { Edit, Settings, Menu, LogOut, Loader2 } from "lucide-react";
import { Button } from "../../Components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../Components/ui/tabs";
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

  // ✅ My real user id (used for followers/following routes)
  const myUserId = currentUser?.id ?? authUser?.id ?? null;

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

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate(PATHS.AUTH);
  };

  const user = currentUser ?? authUser;
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

          <Link
            to={myUserId ? `/home/profile/${myUserId}/followers` : "#"}
            className={myUserId ? "hover:underline" : "cursor-default pointer-events-none"}
          >
            <p className="font-semibold">{followers.length.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Followers</p>
          </Link>

          <Link
            to={myUserId ? `/home/profile/${myUserId}/following` : "#"}
            className={myUserId ? "hover:underline" : "cursor-default pointer-events-none"}
          >
            <p className="font-semibold">{following.length.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Following</p>
          </Link>
        </div>
      </div>

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
