import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import StoryBar from '../../Components/story/StoryBar';
import PostCard from '../../Components/post/PostCard';
import { fetchPosts, fetchMorePosts } from '../../features/posts/postsSlice';

export default function FeedView() {
  const dispatch = useAppDispatch();
  const { feed, status, loadMoreStatus, nextOffset, hasMore } = useAppSelector((state) => state.posts);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    dispatch(fetchPosts());
  }, [dispatch]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (!hasMore || loadMoreStatus === 'loading' || status === 'loading') return;
        if (nextOffset === null) return;
        dispatch(fetchMorePosts(nextOffset));
      },
      { rootMargin: '200px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [dispatch, hasMore, loadMoreStatus, nextOffset, status]);

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

        <div ref={loadMoreRef} />
        {loadMoreStatus === 'loading' && (
          <div className="text-center py-6 text-sm text-muted-foreground">Loading more posts...</div>
        )}
        {!hasMore && feed.length > 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground">You’re all caught up.</div>
        )}
      </div>
    </div>
  );
}
