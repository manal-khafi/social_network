import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { fetchPostById } from "../../features/posts/postsSlice";
import PostCard from "../../Components/post/PostCard";

/** A single post (opened from a like / comment / mention notification). */
export default function PostDetailView() {
  const { postId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const post = useAppSelector((s) => (postId ? s.posts.postById[postId] : undefined));
  const [state, setState] = useState<"loading" | "ready" | "missing">(post ? "ready" : "loading");

  useEffect(() => {
    if (!postId) return;
    dispatch(fetchPostById(postId))
      .unwrap()
      .then(() => setState("ready"))
      .catch(() => setState("missing"));
  }, [dispatch, postId]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 -ms-2 hover:bg-muted rounded-full" aria-label={t("actions.back")}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold">{t("posts.post")}</h1>
      </div>
      {post ? (
        <PostCard post={post} initiallyShowComments={searchParams.get("comments") === "1"} />
      ) : state === "loading" ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-16">{t("posts.postNotFound")}</p>
      )}
    </div>
  );
}
