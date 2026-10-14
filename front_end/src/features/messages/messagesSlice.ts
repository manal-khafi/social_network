import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import * as messagesApi from "../../api/messagesApi";
import type { ApiConversation, ApiMessage, MessagePostPreview, MessageStoryPreview } from "../../api/messagesApi";
import type { RootState } from "../../store";
import i18n from "../../i18n/i18n";

export type MessageType =
  | "text"
  | "image"
  | "video"
  | "file"
  | "call"
  // Kinds the chat UI can compose and render; the API does not persist their
  // extra payload yet (see sendMessage below).
  | "sticker"
  | "poll"
  | "event"
  | "location"
  | "voice"
  // A story card: someone mentioned you in their story, or sent you a story.
  | "story_mention"
  | "story_share"
  // A post sent from its share sheet.
  | "post_share";

export interface MessagePoll {
  question: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
}

export interface MessageEvent {
  title: string;
  date: string;
  time: string;
  location?: string;
}

export interface MessageLocation {
  name: string;
  lat: number;
  lng: number;
}

/** Optional payloads of the non-text message kinds. */
export interface MessageExtras {
  sticker?: string;
  image?: string;
  video?: string;
  poll?: MessagePoll;
  event?: MessageEvent;
  location?: MessageLocation;
  /** URL of a voice message's audio recording. */
  voice?: string;
  voiceDuration?: number;
  /** Story shown as a card (story_mention / story_share). */
  story?: MessageStoryPreview | null;
  /** Post shown as a card (post_share); null once it is no longer available. */
  post?: MessagePostPreview | null;
}

export interface Message extends MessageExtras {
  id: string;
  senderId: string;
  content: string;
  type: MessageType;
  timestamp: string;
  createdAt: string;
  isRead: boolean;
  callMeta?: { callType: "audio" | "video"; status: string; durationSec: number } | null;
  /** Delivery state ("sent" | "delivered" | "seen"); not provided by the API yet. */
  status?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isArchived: boolean;
  isOnline: boolean;
  lastSeen?: string;
  /** Read receipts: when the other participant last read the chat (null if unknown / turned off). */
  otherLastReadAt?: string | null;
  /** Whether the last message was sent by the current user, and when. */
  lastMessageFromMe?: boolean;
  lastMessageAt?: string;
}

/** True when the other participant has read everything up to `sentAt`. */
export const isSeenBy = (otherLastReadAt: string | null | undefined, sentAt: string | undefined) =>
  !!otherLastReadAt && !!sentAt && new Date(otherLastReadAt).getTime() >= new Date(sentAt).getTime();

interface MessagesState {
  conversations: Conversation[];
  archivedConversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  currentConversation: string | null;
  /** Ids of the conversations with unread messages (badge on the inbox icon). */
  unreadConversationIds: string[];
  status: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: MessagesState = {
  conversations: [],
  archivedConversations: [],
  messages: {},
  currentConversation: null,
  unreadConversationIds: [],
  status: "idle",
};

// Texts built here (short times, message previews) are stored in the slice, so
// they are in the interface language as of when the data was loaded.
const rel = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return i18n.t("messages.timeNow");
  if (s < 3600) return i18n.t("messages.timeMinutes", { n: Math.floor(s / 60) });
  if (s < 86400) return i18n.t("messages.timeHours", { n: Math.floor(s / 3600) });
  return i18n.t("messages.timeDays", { n: Math.floor(s / 86400) });
};

// The API has no location message type, so a shared location travels as a text
// message whose content is a geo: URI ("geo:LAT,LNG").
const GEO_PREFIX = "geo:";

export const isLocationContent = (content: string | null | undefined): boolean =>
  !!content && content.startsWith(GEO_PREFIX);

export const encodeLocation = (lat: number, lng: number): string =>
  `${GEO_PREFIX}${lat.toFixed(6)},${lng.toFixed(6)}`;

/** Coordinates of a "geo:LAT,LNG" content, or null when it can't be parsed. */
export const parseLocation = (content: string): { lat: number; lng: number } | null => {
  const match = /^geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(content.trim());
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
};

const summarize = (m: ApiMessage | null): string => {
  if (!m) return "";
  if (m.message_type === "call") {
    const video = m.call_meta?.callType === "video";
    if (m.call_meta?.status === "missed") {
      return i18n.t(video ? "messages.missedVideoCall" : "messages.missedVoiceCall");
    }
    return i18n.t(video ? "messages.videoCall" : "messages.voiceCall");
  }
  if (m.message_type === "image") return i18n.t("messages.photo");
  if (m.message_type === "video") return i18n.t("messages.video");
  if (m.message_type === "file") return i18n.t("messages.voiceMessage");
  if (m.message_type === "story_mention") return i18n.t("messages.storyMentionPreview");
  if (m.message_type === "post") return m.content || i18n.t("messages.postSharePreview");
  if (m.story_id) return m.content || i18n.t("messages.storySharePreview");
  if (m.message_type === "text" && isLocationContent(m.content)) return i18n.t("messages.location");
  return m.content ?? "";
};

const mapConversation = (c: ApiConversation): Conversation => ({
  id: c.id,
  userId: c.other_user?.id ?? "",
  username: c.other_user?.username ?? i18n.t("messages.unknownUser"),
  avatar: c.other_user?.avatar_url ?? undefined,
  lastMessage: summarize(c.last_message),
  timestamp: rel(c.last_message_at),
  unreadCount: c.unread_count,
  isArchived: c.is_archived,
  isOnline: false,
  otherLastReadAt: c.other_last_read_at,
  lastMessageFromMe: !!c.last_message && c.last_message.sender_id !== c.other_user?.id,
  lastMessageAt: c.last_message?.created_at,
});

// A voice message is a "file" message whose content is the recording's URL with
// its length in seconds in the fragment: "https://...#voice=23". (Browsers often
// cannot read the duration of a freshly recorded file, so it travels with it.)
const VOICE_FRAGMENT = /#voice=(\d+)$/;

export const encodeVoice = (url: string, seconds: number) =>
  `${url}#voice=${Math.max(0, Math.round(seconds))}`;

const mapVoiceMessage = (m: ApiMessage): Message => {
  const content = m.content ?? "";
  const match = VOICE_FRAGMENT.exec(content);
  return {
    id: m.id,
    senderId: m.sender_id,
    content: "",
    type: "voice",
    voice: content.replace(VOICE_FRAGMENT, ""),
    voiceDuration: match ? Number(match[1]) : undefined,
    timestamp: rel(m.created_at),
    createdAt: m.created_at,
    isRead: true,
  };
};

const mapLocationMessage = (m: ApiMessage): Message => {
  const coords = parseLocation(m.content ?? "");
  return {
    id: m.id,
    senderId: m.sender_id,
    content: "",
    type: "location",
    location: coords ? { name: i18n.t("messages.sharedLocation"), ...coords } : undefined,
    timestamp: rel(m.created_at),
    createdAt: m.created_at,
    isRead: true,
  };
};

// Image / video messages carry the media URL as their content.
const mapStoryMessage = (m: ApiMessage): Message => ({
  id: m.id,
  senderId: m.sender_id,
  content: m.content ?? "", // the note sent with a shared story
  type: m.message_type === "story_mention" ? "story_mention" : "story_share",
  story: m.story ?? null,
  timestamp: rel(m.created_at),
  createdAt: m.created_at,
  isRead: true,
});

const mapPostMessage = (m: ApiMessage): Message => ({
  id: m.id,
  senderId: m.sender_id,
  content: m.content ?? "", // the note sent with the post
  type: "post_share",
  post: m.post ?? null,
  timestamp: rel(m.created_at),
  createdAt: m.created_at,
  isRead: true,
});

const mapMessage = (m: ApiMessage): Message =>
  m.message_type === "post"
    ? mapPostMessage(m)
    : m.message_type === "story_mention" || (m.story_id && m.message_type === "text")
    ? mapStoryMessage(m)
    : m.message_type === "file"
    ? mapVoiceMessage(m)
    : m.message_type === "text" && isLocationContent(m.content)
    ? mapLocationMessage(m)
    : mapMediaMessage(m);

const mapMediaMessage = (m: ApiMessage): Message => ({
  id: m.id,
  senderId: m.sender_id,
  content: m.message_type === "image" || m.message_type === "video" ? "" : m.content ?? "",
  image: m.message_type === "image" ? m.content ?? undefined : undefined,
  video: m.message_type === "video" ? m.content ?? undefined : undefined,
  type: m.message_type === "post" ? "post_share" : m.message_type, // "post" is handled by mapPostMessage
  timestamp: rel(m.created_at),
  createdAt: m.created_at,
  isRead: true,
  callMeta: m.call_meta,
});

// --- Thunks ---

export const fetchConversations = createAsyncThunk("messages/fetchConversations", async () => {
  const list = await messagesApi.listConversations();
  return list.map(mapConversation);
});

export const fetchMessages = createAsyncThunk(
  "messages/fetchMessages",
  async (conversationId: string) => {
    const msgs = await messagesApi.getMessages(conversationId);
    return { conversationId, messages: msgs.map(mapMessage) };
  }
);

export const openDirectByUserId = createAsyncThunk(
  "messages/openDirect",
  async (userId: string) => {
    const conv = await messagesApi.openDirectConversation(userId);
    return conv.id;
  }
);

/** Fetch a single conversation (e.g. deep link / archived chat not in a list). */
export const fetchConversation = createAsyncThunk(
  "messages/fetchOne",
  async (conversationId: string) => {
    const c = await messagesApi.getConversation(conversationId);
    const conv: Conversation = {
      id: c.id,
      userId: c.other_user?.id ?? "",
      username: c.other_user?.username ?? i18n.t("messages.unknownUser"),
      avatar: c.other_user?.avatar_url ?? undefined,
      lastMessage: "",
      timestamp: rel(c.last_message_at),
      unreadCount: 0,
      isArchived: false,
      isOnline: false,
      otherLastReadAt: c.other_last_read_at,
    };
    return conv;
  }
);

export const sendMessage = createAsyncThunk(
  "messages/sendMessage",
  async (
    // Text messages send their content; image / video / voice messages send the
    // uploaded media URL. The other extras are accepted so the composer can
    // describe richer messages, but the API ignores them for now.
    payload: { conversationId: string; content: string; type?: MessageType } & MessageExtras,
    { rejectWithValue }
  ) => {
    const mediaType =
      payload.type === "image" && payload.image
        ? "image"
        : payload.type === "video" && payload.video
        ? "video"
        : null;
    const isVoice = payload.type === "voice" && !!payload.voice;
    const content = (
      mediaType
        ? payload[mediaType] ?? ""
        : isVoice
        ? encodeVoice(payload.voice ?? "", payload.voiceDuration ?? 0)
        : payload.type === "location" && payload.location
        ? encodeLocation(payload.location.lat, payload.location.lng)
        : payload.content ?? ""
    ).trim();
    if (!content) return rejectWithValue("empty");
    const m = await messagesApi.sendMessage(
      payload.conversationId,
      content,
      mediaType ?? (isVoice ? "file" : "text")
    );
    return mapMessage(m);
  }
);

export const fetchArchivedConversations = createAsyncThunk(
  "messages/fetchArchived",
  async () => {
    const list = await messagesApi.listConversations(true);
    return list.map(mapConversation);
  }
);

export const fetchUnreadConversationCount = createAsyncThunk(
  "messages/fetchUnreadConversationCount",
  async () => (await messagesApi.getUnreadConversations()).conversation_ids
);

export const markRead = createAsyncThunk("messages/markRead", async (conversationId: string) => {
  await messagesApi.markConversationRead(conversationId);
  return conversationId;
});

export const archiveConversation = createAsyncThunk(
  "messages/archive",
  async (conversationId: string) => {
    await messagesApi.setConversationArchived(conversationId, true);
    return conversationId;
  }
);

export const unarchiveConversation = createAsyncThunk(
  "messages/unarchive",
  async (conversationId: string) => {
    await messagesApi.setConversationArchived(conversationId, false);
    return conversationId;
  }
);

// No hard delete server-side: archive it and drop it from local lists so it
// disappears from the UI (returns only on a full refetch).
export const deleteConversation = createAsyncThunk(
  "messages/delete",
  async (conversationId: string) => {
    await messagesApi.setConversationArchived(conversationId, true);
    return conversationId;
  }
);

/** Marks a conversation as read everywhere it is tracked (lists + nav badge). */
const clearUnread = (state: MessagesState, conversationId: string) => {
  state.unreadConversationIds = state.unreadConversationIds.filter((id) => id !== conversationId);
  for (const c of [...state.conversations, ...state.archivedConversations]) {
    if (c.id === conversationId) c.unreadCount = 0;
  }
};

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    setCurrentConversation: (state, action: PayloadAction<string | null>) => {
      state.currentConversation = action.payload;
      if (action.payload) clearUnread(state, action.payload);
    },
    // Realtime message:new
    receiveMessage: (state, action: PayloadAction<ApiMessage>) => {
      const m = action.payload;
      const list = state.messages[m.conversation_id] ?? [];
      if (list.some((x) => x.id === m.id)) return;
      state.messages[m.conversation_id] = [...list, mapMessage(m)];

      if (
        state.currentConversation !== m.conversation_id &&
        !state.unreadConversationIds.includes(m.conversation_id)
      ) {
        state.unreadConversationIds.push(m.conversation_id);
      }

      const conv = state.conversations.find((c) => c.id === m.conversation_id);
      if (conv) {
        conv.lastMessage = summarize(m);
        conv.timestamp = i18n.t("messages.timeNow");
        conv.lastMessageFromMe = false;
        conv.lastMessageAt = m.created_at;
        if (state.currentConversation !== m.conversation_id) conv.unreadCount += 1;
        state.conversations = [
          conv,
          ...state.conversations.filter((c) => c.id !== conv.id),
        ];
      }
    },
    /** Socket "conversation:read": the other participant read the chat. */
    conversationRead: (
      state,
      action: PayloadAction<{ conversationId: string; userId: string; last_read_at: string }>
    ) => {
      const { conversationId, last_read_at } = action.payload;
      for (const c of [...state.conversations, ...state.archivedConversations]) {
        if (c.id === conversationId) c.otherLastReadAt = last_read_at;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.conversations = action.payload;
        // The list may have been computed before the open chat was marked read.
        if (state.currentConversation) clearUnread(state, state.currentConversation);
      })
      .addCase(fetchConversations.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messages[action.payload.conversationId] = action.payload.messages;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const m = action.payload;
        const convId = action.meta.arg.conversationId;
        const arr = state.messages[convId] ?? [];
        if (!arr.some((x) => x.id === m.id)) state.messages[convId] = [...arr, m];
        const conv = state.conversations.find((c) => c.id === convId);
        if (conv) {
          conv.lastMessage =
            m.type === "text"
              ? m.content
              : m.type === "location"
              ? i18n.t("messages.location")
              : m.type === "voice"
              ? i18n.t("messages.voiceMessage")
              : m.type === "video"
              ? i18n.t("messages.video")
              : i18n.t("messages.photo");
          conv.timestamp = i18n.t("messages.timeNow");
          conv.lastMessageFromMe = true;
          conv.lastMessageAt = m.createdAt;
          state.conversations = [conv, ...state.conversations.filter((c) => c.id !== conv.id)];
        }
      })
      .addCase(markRead.fulfilled, (state, action) => {
        clearUnread(state, action.payload);
      })
      .addCase(fetchUnreadConversationCount.fulfilled, (state, action) => {
        // The open conversation is being read right now.
        state.unreadConversationIds = action.payload.filter(
          (id) => id !== state.currentConversation
        );
      })
      .addCase(fetchArchivedConversations.fulfilled, (state, action) => {
        state.archivedConversations = action.payload;
        if (state.currentConversation) clearUnread(state, state.currentConversation);
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        const c = action.payload;
        if (
          !state.conversations.some((x) => x.id === c.id) &&
          !state.archivedConversations.some((x) => x.id === c.id)
        ) {
          state.conversations = [c, ...state.conversations];
        }
      })
      .addCase(archiveConversation.fulfilled, (state, action) => {
        const moved = state.conversations.find((c) => c.id === action.payload);
        state.conversations = state.conversations.filter((c) => c.id !== action.payload);
        if (moved && !state.archivedConversations.some((c) => c.id === moved.id)) {
          state.archivedConversations = [{ ...moved, isArchived: true }, ...state.archivedConversations];
        }
      })
      .addCase(unarchiveConversation.fulfilled, (state, action) => {
        const moved = state.archivedConversations.find((c) => c.id === action.payload);
        state.archivedConversations = state.archivedConversations.filter(
          (c) => c.id !== action.payload
        );
        if (moved && !state.conversations.some((c) => c.id === moved.id)) {
          state.conversations = [{ ...moved, isArchived: false }, ...state.conversations];
        }
      })
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter((c) => c.id !== action.payload);
        state.archivedConversations = state.archivedConversations.filter(
          (c) => c.id !== action.payload
        );
        delete state.messages[action.payload];
      });
  },
});

export const { setCurrentConversation, receiveMessage, conversationRead } = messagesSlice.actions;

export const selectUnreadConversationCount = (s: RootState) =>
  s.messages.unreadConversationIds.length;

export const selectConversation = (id: string | undefined) => (s: RootState) =>
  s.messages.conversations.find((c) => c.id === id);

export default messagesSlice.reducer;
