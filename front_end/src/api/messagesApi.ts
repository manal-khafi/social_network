import api from "./axios";
import type { StoryUser } from "./storiesApi";

export interface ApiMessage {
  id: string;
  conversation_id: string;
  sender: StoryUser | null;
  sender_id: string;
  content: string | null;
  message_type: "text" | "image" | "video" | "file" | "call" | "story_mention" | "post";
  call_meta: { callType: "audio" | "video"; status: string; durationSec: number } | null;
  story_id: string | null;
  /** Preview of the shared / mentioning story, when the message is about one. */
  story?: MessageStoryPreview | null;
  post_id?: string | null;
  /** Preview of the shared post (message_type "post"); null once it is deleted or archived. */
  post?: MessagePostPreview | null;
  created_at: string;
}

export interface MessagePostPreview {
  id: string;
  user: StoryUser;
  content: string;
  media_urls: string[];
}

export interface MessageStoryPreview {
  id: string;
  user: StoryUser;
  content_url: string;
  content_type: "image" | "video" | "text" | "link";
  thumbnail_url: string | null;
  bg_color: string | null;
  caption: string | null;
  expired: boolean;
}

export interface ApiConversation {
  id: string;
  is_group: boolean;
  other_user: StoryUser | null;
  last_message: ApiMessage | null;
  last_message_at: string;
  unread_count: number;
  /** When the other participant last read the chat; null if never, or if they turned read receipts off. */
  other_last_read_at: string | null;
  is_archived: boolean;
}

export const listConversations = async (archived = false): Promise<ApiConversation[]> => {
  const res = await api.get("/conversations", archived ? { params: { archived: true } } : undefined);
  return res.data.data;
};

export const getUnreadConversations = async (): Promise<{
  count: number;
  conversation_ids: string[];
}> => {
  const res = await api.get("/conversations/unread-count");
  return res.data;
};

export const openDirectConversation = async (
  userId: string
): Promise<{ id: string; other_user: StoryUser | null }> => {
  const res = await api.post("/conversations", { user_id: userId });
  return res.data.data;
};

export const getConversation = async (
  conversationId: string
): Promise<{
  id: string;
  is_group: boolean;
  other_user: StoryUser | null;
  other_last_read_at: string | null;
  last_message_at: string;
}> => {
  const res = await api.get(`/conversations/${conversationId}`);
  return res.data.data;
};

export const getMessages = async (
  conversationId: string,
  opts: { before?: string; limit?: number } = {}
): Promise<ApiMessage[]> => {
  const res = await api.get(`/conversations/${conversationId}/messages`, { params: opts });
  return res.data.data;
};

export const sendMessage = async (
  conversationId: string,
  content: string,
  messageType: "text" | "image" | "video" | "file" = "text"
): Promise<ApiMessage> => {
  const res = await api.post(`/conversations/${conversationId}/messages`, {
    content,
    message_type: messageType,
  });
  return res.data.data;
};

export const markConversationRead = async (conversationId: string): Promise<void> => {
  await api.post(`/conversations/${conversationId}/read`);
};

export const setConversationArchived = async (
  conversationId: string,
  archived: boolean
): Promise<void> => {
  await api.post(`/conversations/${conversationId}/archive`, { archived });
};

export const getIceServers = async (): Promise<{
  iceServers: RTCIceServer[];
  hasTurn: boolean;
}> => {
  const res = await api.get("/rtc/ice-servers");
  return res.data;
};
