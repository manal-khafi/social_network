import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import StoryBar from '../../Components/story/StoryBar';
import PostCard from '../../Components/post/PostCard';
import { fetchPosts, fetchMorePosts } from '../../features/posts/postsSlice';
import { useTranslation } from 'react-i18next';

export default function FeedView() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { feed, status, loadMoreStatus, nextOffset, hasMore } = useAppSelector((state) => state.posts);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const filteredFeed = feed ?? [];

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
    <div className="min-h-screen bg-background">
      <StoryBar />
      
      <div className="space-y-6 px-4 pb-6">
        {filteredFeed.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        
        {filteredFeed.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('empty.feedFollow')}</p>
          </div>
        )}

        <div ref={loadMoreRef} />
        {loadMoreStatus === 'loading' && (
          <div className="text-center py-6 text-sm text-muted-foreground">{t('posts.loadingMore')}</div>
        )}
        {!hasMore && feed.length > 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground">{t('posts.allCaughtUp')}</div>
        )}
      </div>
    </div>
  );
}
