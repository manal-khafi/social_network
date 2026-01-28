import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { fetchMyArchivedPosts } from "../../features/posts/postsSlice";
import PostCard from "../../Components/post/PostCard";

const MyArchivedPostsView = () => {
  const dispatch = useAppDispatch();
  const { archivedPosts, status, error } = useAppSelector((state) => state.posts);

  useEffect(() => {
    dispatch(fetchMyArchivedPosts());
  }, [dispatch]);

  if (status === "loading") return <div>Loading...</div>;
  if (status === "failed") return <div>Error: {error}</div>;

  return (
    <div className="space-y-4">
      {archivedPosts.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No archived posts yet.</p>
      ) : (
        archivedPosts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
};

export default MyArchivedPostsView;
