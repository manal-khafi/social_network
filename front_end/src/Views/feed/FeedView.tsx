import { useAppSelector } from '../../hooks';
import StoryBar from '../../Componenets/story/StoryBar';
import PostCard from '../../Componenets/post/PostCard';

export default function FeedView() {
  const { feed } = useAppSelector((state) => state.posts);

  return (
    <div className="min-h-screen">
      <StoryBar />
      
      <div className="space-y-4 p-4">
        {feed.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        
        {feed.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet. Start following people to see their posts!</p>
          </div>
        )}
      </div>
    </div>
  );
}
