import api from "./axios";
import type { StoryUser } from "./storiesApi";

export const getCloseFriends = async (): Promise<StoryUser[]> => {
  const res = await api.get("/follow/close-friends");
  return (res.data?.data ?? []).map((u: any) => ({
    id: u.id,
    username: u.username,
    display_name: u.display_name,
    avatar_url: u.avatar_url ?? null,
  }));
};

export const addCloseFriend = async (userId: string): Promise<void> => {
  await api.put(`/follow/close-friends/${userId}`);
};

export const removeCloseFriend = async (userId: string): Promise<void> => {
  await api.delete(`/follow/close-friends/${userId}`);
};
