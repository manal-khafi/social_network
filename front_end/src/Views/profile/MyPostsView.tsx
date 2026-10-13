import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { fetchMyPosts } from "../../features/posts/postsSlice";
import PostCard from "../../Components/post/PostCard";
import { useTranslation } from "react-i18next";

const MyPostsView = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { myPosts, status, error } = useAppSelector((state) => state.posts);

  useEffect(() => {
    dispatch(fetchMyPosts());
  }, [dispatch]);

  if (status === "loading") return <div>{t("actions.loading")}</div>;
  if (status === "failed") return <div>{t("errors.withMessage", { message: error })}</div>;

  return (
    <div className="space-y-4">
      {myPosts.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{t("empty.feed")}</p>
      ) : (
        myPosts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
};

export default MyPostsView;
