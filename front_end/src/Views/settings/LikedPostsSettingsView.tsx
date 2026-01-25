import { useAppSelector } from '../../hooks';
import { Card } from '../../Components/ui/card';
import PostCard from '../../Components/post/PostCard';
import { Heart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LikedPostsSettingsView() {
  const navigate = useNavigate();
  const { feed, savedPosts } = useAppSelector((state) => state.posts);

  // Create a Set of liked post IDs to avoid duplicates
  const likedPostIds = new Set();
  const allPosts = [...feed, ...savedPosts];
  const uniqueLikedPosts = allPosts.filter(p => {
    if (p.isLiked && !likedPostIds.has(p.id)) {
      likedPostIds.add(p.id);
      return true;
    }
    return false;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Liked Posts</h1>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        {uniqueLikedPosts.length === 0 ? (
          <Card className="p-8 text-center">
            <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No liked posts yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              When you like a post, it will appear here.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {uniqueLikedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
