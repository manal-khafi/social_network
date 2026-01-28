import { useAppSelector } from '../../hooks';
import { Card } from '../../Components/ui/card';
import PostCard from '../../Components/post/PostCard';
import { Archive } from 'lucide-react';

export default function ArchivedPostsView() {
  const { archivedPosts } = useAppSelector((state) => state.posts);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-3 mb-4">
        <Archive className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Archived Posts</h1>
      </div>

      {archivedPosts.length === 0 ? (
        <Card className="p-8 text-center">
          <Archive className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No archived posts</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {archivedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
