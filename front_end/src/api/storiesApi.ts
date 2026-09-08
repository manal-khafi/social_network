import api from "./axios";

export interface StoryUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export type StoryContentType = "image" | "video" | "text" | "link";
export type StoryVisibility = "public" | "friends" | "close_friends";

export interface StoryMusic {
  track_id: string | null;
  title: string | null;
  artist: string | null;
  cover_url: string | null;
  preview_url: string | null;
  start_sec: number;
}

export interface MusicTrack {
  track_id: string;
  title: string;
  artist: string;
  album: string | null;
  cover_url: string | null;
  preview_url: string;
  duration_sec: number | null;
}

export type StoryOverlayType = "text" | "emoji" | "mention" | "post" | "link" | "poll";

export interface StoryOverlay {
  id: string;
  type: StoryOverlayType;
  text?: string;
  /** relative position of the centre of the element, 0..1 of the canvas */
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
  color?: string;
  background?: string | null;
  fontFamily?: string;
  // link sticker
  url?: string;
  label?: string;
  // poll sticker
  question?: string;
  options?: string[];
}

export interface PollResult {
  counts: Record<number, number> | null;
  total: number;
  my_choice: number | null;
}

export interface SharedPostRef {
  id: string;
  content: string | null;
  media_urls: unknown;
  created_at: string;
  user: StoryUser;
}

export interface Story {
  id: string;
  content_url: string;
  content_type: StoryContentType;
  visibility: StoryVisibility;
  caption: string | null;
  thumbnail_url: string | null;
  duration_sec: number | null;
  bg_color: string | null;
  overlays: StoryOverlay[] | null;
  music: StoryMusic | null;
  shared_post_id: string | null;
  shared_story_id: string | null;
  sharedPost?: SharedPostRef | null;
  sharedStory?: (Story & { user: StoryUser }) | null;
  duration_hours: number;
  expires_at: string;
  created_at: string;
  user_id: string;
  user: StoryUser;
  has_viewed: boolean;
  has_liked: boolean;
  my_reaction: string | null;
  _count: { views: number; likes: number; comments: number; reactions: number };
}

export interface StoryGroup {
  user: StoryUser;
  has_unseen: boolean;
  latest_at: string;
  items: Story[];
}

export interface StoryReactionEntry {
  id: string;
  emoji: string;
  created_at: string;
  user: StoryUser;
}

export interface StoryViewEntry {
  id: string;
  viewed_at: string;
  viewer: StoryUser;
}

export interface CreateStoryPayload {
  content_url: string;
  content_type: StoryContentType;
  visibility?: StoryVisibility;
  duration_hours?: number;
  caption?: string;
  thumbnail_url?: string;
  duration_sec?: number;
  bg_color?: string;
  overlays?: StoryOverlay[];
  music?: {
    track_id?: string;
    title?: string;
    artist?: string;
    cover_url?: string;
    preview_url?: string;
    start_sec?: number;
  } | null;
  shared_post_id?: string;
  shared_story_id?: string;
}

export const DEFAULT_REACTIONS = ["❤️", "😂", "😮", "😢", "👏", "🔥", "🎉", "😍"];

// ---- Feed / CRUD ----

export const getStoriesFeed = async (): Promise<StoryGroup[]> => {
  const res = await api.get("/stories");
  return res.data.data;
};

export const getUserStories = async (
  userId: string
): Promise<{ user: StoryUser; items: Story[] }> => {
  const res = await api.get(`/stories/user/${userId}`);
  return res.data.data;
};

export const getStory = async (id: string): Promise<Story> => {
  const res = await api.get(`/stories/${id}`);
  return res.data.data;
};

export const createStory = async (payload: CreateStoryPayload): Promise<Story> => {
  const res = await api.post("/stories", payload);
  return res.data.data;
};

export const deleteStory = async (id: string): Promise<void> => {
  await api.delete(`/stories/${id}`);
};

// ---- Interactions ----

export const viewStory = async (id: string): Promise<void> => {
  await api.post(`/stories/${id}/view`);
};

export const likeStory = async (id: string): Promise<void> => {
  await api.post(`/stories/${id}/like`);
};

export const unlikeStory = async (id: string): Promise<void> => {
  await api.delete(`/stories/${id}/like`);
};

export const reactToStory = async (id: string, emoji: string): Promise<void> => {
  await api.post(`/stories/${id}/reactions`, { emoji });
};

export const removeStoryReaction = async (id: string): Promise<void> => {
  await api.delete(`/stories/${id}/reactions`);
};

export const getStoryReactions = async (
  id: string
): Promise<{ total: number; summary: Record<string, number>; reactions: StoryReactionEntry[] }> => {
  const res = await api.get(`/stories/${id}/reactions`);
  return res.data.data;
};

export const getStoryViews = async (id: string): Promise<StoryViewEntry[]> => {
  const res = await api.get(`/stories/${id}/views`);
  return res.data.data;
};

export const replyToStory = async (id: string, content: string): Promise<void> => {
  await api.post(`/stories/${id}/message`, { content });
};

export const shareStory = async (
  id: string,
  recipientIds: string[],
  note?: string
): Promise<{ shared_count: number }> => {
  const res = await api.post(`/stories/${id}/share`, {
    recipient_ids: recipientIds,
    note,
  });
  return res.data.data;
};

// ---- Poll stickers ----

export const votePoll = async (
  storyId: string,
  overlayId: string,
  optionIndex: number
): Promise<PollResult> => {
  const res = await api.post(`/stories/${storyId}/poll`, {
    overlay_id: overlayId,
    option_index: optionIndex,
  });
  return res.data.data;
};

export const getPollResults = async (
  storyId: string,
  overlayId: string
): Promise<PollResult> => {
  const res = await api.get(`/stories/${storyId}/poll/${overlayId}`);
  return res.data.data;
};

// ---- Music ----

export const searchMusic = async (q: string): Promise<MusicTrack[]> => {
  const res = await api.get("/stories/music/search", { params: { q } });
  return res.data.data;
};

// ---- Friends (for the share sheet) ----

export const getFollowing = async (userId: string): Promise<StoryUser[]> => {
  const res = await api.get(`/follow/following/${userId}`);
  return (res.data?.users ?? []).map((u: any) => ({
    id: u.id,
    username: u.username,
    display_name: u.display_name,
    avatar_url: u.avatar_url ?? null,
  }));
};
