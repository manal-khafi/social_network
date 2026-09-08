import api from "./axios";
import type { Story, StoryUser } from "./storiesApi";

export interface HighlightSummary {
  id: string;
  title: string;
  cover_url: string | null;
  item_count: number;
  updated_at: string;
}

export interface Highlight {
  id: string;
  title: string;
  cover_url: string | null;
  user: StoryUser;
  items: Story[];
}

export const getUserHighlights = async (userId: string): Promise<HighlightSummary[]> => {
  const res = await api.get(`/stories/highlights/user/${userId}`);
  return res.data.data;
};

export const getHighlight = async (id: string): Promise<Highlight> => {
  const res = await api.get(`/stories/highlights/${id}`);
  return res.data.data;
};

export const createHighlight = async (payload: {
  title: string;
  cover_url?: string;
  story_ids?: string[];
}): Promise<HighlightSummary> => {
  const res = await api.post("/stories/highlights", payload);
  return res.data.data;
};

export const addToHighlight = async (id: string, storyIds: string[]): Promise<void> => {
  await api.post(`/stories/highlights/${id}/items`, { story_ids: storyIds });
};

export const removeFromHighlight = async (id: string, storyId: string): Promise<{ deleted: boolean }> => {
  const res = await api.delete(`/stories/highlights/${id}/items/${storyId}`);
  return res.data;
};

export const renameHighlight = async (id: string, title: string): Promise<void> => {
  await api.patch(`/stories/highlights/${id}`, { title });
};

export const deleteHighlight = async (id: string): Promise<void> => {
  await api.delete(`/stories/highlights/${id}`);
};
