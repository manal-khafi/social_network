import { useAppSelector } from '../hooks';
import { Card } from '../Components/ui/card';
import PostCard from '../Components/post/PostCard';
import { Heart } from 'lucide-react';

export default function LikedPostsView() {
  const { feed, savedPosts } = useAppSelector((state) => state.posts);
  const likedPosts = [...feed, ...savedPosts].filter(p => p.isLiked);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-3 mb-4">
        <Heart className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Liked Posts</h1>
      </div>

      {likedPosts.length === 0 ? (
        <Card className="p-8 text-center">
          <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No liked posts yet</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {likedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
