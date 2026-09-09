import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import * as messagesApi from "../../api/messagesApi";
import type { ApiConversation, ApiMessage } from "../../api/messagesApi";
import type { RootState } from "../../store";

export type MessageType = "text" | "image" | "video" | "file" | "call";

export interface Message {
  id: string;
  senderId: string;
  content: string;
  type: MessageType;
  timestamp: string;
  createdAt: string;
  isRead: boolean;
  callMeta?: { callType: "audio" | "video"; status: string; durationSec: number } | null;
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
}

interface MessagesState {
  conversations: Conversation[];
  archivedConversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  currentConversation: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: MessagesState = {
  conversations: [],
  archivedConversations: [],
  messages: {},
  currentConversation: null,
  status: "idle",
};

const rel = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

const summarize = (m: ApiMessage | null): string => {
  if (!m) return "";
  if (m.message_type === "call") {
    const t = m.call_meta?.callType === "video" ? "Video call" : "Voice call";
    return m.call_meta?.status === "missed" ? `Missed ${t.toLowerCase()}` : t;
  }
  if (m.message_type === "image") return "Photo";
  return m.content ?? "";
};

const mapConversation = (c: ApiConversation): Conversation => ({
  id: c.id,
  userId: c.other_user?.id ?? "",
  username: c.other_user?.username ?? "Unknown",
  avatar: c.other_user?.avatar_url ?? undefined,
  lastMessage: summarize(c.last_message),
  timestamp: rel(c.last_message_at),
  unreadCount: c.unread_count,
  isArchived: c.is_archived,
  isOnline: false,
});

const mapMessage = (m: ApiMessage): Message => ({
  id: m.id,
  senderId: m.sender_id,
  content: m.content ?? "",
  type: m.message_type,
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

export const sendMessage = createAsyncThunk(
  "messages/sendMessage",
  async (
    payload: { conversationId: string; content: string; type?: string },
    { rejectWithValue }
  ) => {
    const content = (payload.content ?? "").trim();
    if (!content) return rejectWithValue("empty");
    const m = await messagesApi.sendMessage(payload.conversationId, content);
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

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    setCurrentConversation: (state, action: PayloadAction<string | null>) => {
      state.currentConversation = action.payload;
      if (action.payload) {
        const c = state.conversations.find((x) => x.id === action.payload);
        if (c) c.unreadCount = 0;
      }
    },
    // Realtime message:new
    receiveMessage: (state, action: PayloadAction<ApiMessage>) => {
      const m = action.payload;
      const list = state.messages[m.conversation_id] ?? [];
      if (list.some((x) => x.id === m.id)) return;
      state.messages[m.conversation_id] = [...list, mapMessage(m)];

      const conv = state.conversations.find((c) => c.id === m.conversation_id);
      if (conv) {
        conv.lastMessage = summarize(m);
        conv.timestamp = "now";
        if (state.currentConversation !== m.conversation_id) conv.unreadCount += 1;
        state.conversations = [
          conv,
          ...state.conversations.filter((c) => c.id !== conv.id),
        ];
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
          conv.lastMessage = m.type === "text" ? m.content : "Photo";
          conv.timestamp = "now";
          state.conversations = [conv, ...state.conversations.filter((c) => c.id !== conv.id)];
        }
      })
      .addCase(markRead.fulfilled, (state, action) => {
        const c = state.conversations.find((x) => x.id === action.payload);
        if (c) c.unreadCount = 0;
      })
      .addCase(fetchArchivedConversations.fulfilled, (state, action) => {
        state.archivedConversations = action.payload;
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

export const { setCurrentConversation, receiveMessage } = messagesSlice.actions;

export const selectConversation = (id: string | undefined) => (s: RootState) =>
  s.messages.conversations.find((c) => c.id === id);

export default messagesSlice.reducer;
