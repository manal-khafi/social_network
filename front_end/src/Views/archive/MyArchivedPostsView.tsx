import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { fetchMyArchivedPosts } from "../../features/posts/postsSlice";
import { Card } from "../../Components/ui/card";
import PostCard from "../../Components/post/PostCard";
import { Archive, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

// Same layout as the liked posts page (settings/LikedPostsSettingsView).
const MyArchivedPostsView = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { archivedPosts, status, error } = useAppSelector((state) => state.posts);

  useEffect(() => {
    dispatch(fetchMyArchivedPosts());
  }, [dispatch]);

  const loading = status === "loading";
  const failed = status === "failed";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Archived Posts</h1>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading your archived posts...</p>
          </div>
        )}

        {failed && (
          <Card className="p-6 border-destructive/50 bg-destructive/10 text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 text-destructive" />
            <p className="font-medium text-destructive">{error || "Could not load archived posts"}</p>
            <button onClick={() => dispatch(fetchMyArchivedPosts())} className="mt-4 text-sm underline">
              Try again
            </button>
          </Card>
        )}

        {!loading && !failed && archivedPosts.length === 0 && (
          <Card className="p-8 text-center">
            <Archive className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No archived posts yet</p>
            <p className="text-sm text-muted-foreground mt-2">Posts you archive will appear here.</p>
          </Card>
        )}

        {!loading && !failed && archivedPosts.length > 0 && (
          <div className="space-y-4">
            {archivedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyArchivedPostsView;
