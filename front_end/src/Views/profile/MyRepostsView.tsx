import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { fetchMyReposts } from "../../features/posts/postsSlice";
import PostCard from "../../Components/post/PostCard";
import { useTranslation } from "react-i18next";

const MyRepostsView = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { myReposts, status, error } = useAppSelector((state) => state.posts);

  useEffect(() => {
    dispatch(fetchMyReposts());
  }, [dispatch]);

  if (status === "loading") return <div>{t("actions.loading")}</div>;
  if (status === "failed") return <div>{t("errors.withMessage", { message: error })}</div>;

  return (
    <div className="space-y-4">
      {myReposts.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{t("empty.reposts")}</p>
      ) : (
        myReposts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
};

export default MyRepostsView;
