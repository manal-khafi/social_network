import api from "../../api/axios";
import type { Post } from "./postsSlice";

export const fetchMyPosts = async (): Promise<Post[]> => {
  const response = await api.get("/posts/me");
  return response.data.posts;
};
