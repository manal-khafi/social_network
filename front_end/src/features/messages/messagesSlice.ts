import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import api from "../../api/axios";
import { getSocket } from "../../realtime/socket";
import type { RootState } from "../../store";

export type MessageType =
  | "text"
  | "sticker"
  | "location"
  | "image"
  | "voice"
  | "file"
  | "poll"
  | "event";

export type MessageStatus = "sending" | "sent" | "delivered" | "seen";

export interface Message {
  id: string;
  clientMessageId?: string;
  senderId: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  timestamp: string;
  isRead: boolean;
  isDeleted?: boolean;
  deletedForAll?: boolean;

  image?: string;
  sticker?: string;
  location?: { name: string; lat: number; lng: number };
  voiceDuration?: number;
  voiceUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileMime?: string;
  fileSize?: number;
  poll?: any;
  event?: any;
}

export interface Conversation {
  id: string;
  userId: string; // other user id
  username: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isArchived: boolean;
  isOnline: boolean;
  lastSeen?: string;
}

type ConversationApi = {
  id: string;
  title?: string | null;
  isGroup: boolean;
  lastMessage?: {
    id: string;
    content: string | null;
    type: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
  participantState: {
    isArchived: boolean;
    lastReadAt: string | null;
  };
  otherUser?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  } | null;
};

type MessageApi = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  type: string;
  payload: any;
  isEdited: boolean;
  isDeleted: boolean;
  deletedForAll: boolean;
  createdAt: string;
  updatedAt: string;
};

const formatTimeAgo = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const normalizeIncomingType = (raw: string, payload: any): MessageType => {
  const t = String(raw || "text").toLowerCase();
  if (t === "sticker") return "sticker";
  if (t === "location") return "location";
  if (t === "image") return "image";
  if (t === "audio") return "voice";
  if (t === "file") return "file";

  // Back-end normalizes poll/event as text with payload
  if (payload?.poll) return "poll";
  if (payload?.event) return "event";
  return "text";
};

const mapIncomingMessage = (m: {
  id: string;
  senderId: string;
  content?: string | null;
  type?: string;
  payload?: any;
  createdAt?: string;
  isDeleted?: boolean;
  deletedForAll?: boolean;
  clientMessageId?: string | null;
}): Message => {
  const payload = m.payload ?? null;
  const type = normalizeIncomingType(String(m.type ?? "text"), payload);

  const base: Message = {
    id: m.id,
    clientMessageId: m.clientMessageId ?? undefined,
    senderId: m.senderId,
    content: m.content ?? "",
    type,
    status: "sent",
    timestamp: formatTimeAgo(m.createdAt ?? null),
    isRead: false,
    isDeleted: Boolean(m.isDeleted),
    deletedForAll: Boolean(m.deletedForAll),
  };

  if (type === "sticker") base.sticker = base.content;
  if (type === "image") base.image = payload?.url ?? payload?.imageUrl;
  if (type === "location") base.location = payload?.location ?? payload;
  if (type === "voice") {
    base.voiceDuration = payload?.duration ?? payload?.voiceDuration;
    base.voiceUrl = payload?.url ?? payload?.audioUrl;
  }
  if (type === "file") {
    base.fileUrl = payload?.url;
    base.fileName = payload?.name ?? payload?.fileName;
    base.fileMime = payload?.mimetype ?? payload?.mime;
    base.fileSize = payload?.size;
  }
  if (type === "poll") base.poll = payload?.poll;
  if (type === "event") base.event = payload?.event;

  return base;
};

interface MessagesState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  currentConversation: string | null;
  typingByConversation: Record<string, Record<string, boolean>>;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  connected: boolean;
  unreadTotal: number;
}

const initialState: MessagesState = {
  conversations: [],
  messages: {},
  currentConversation: null,
  typingByConversation: {},
  status: "idle",
  error: null,
  connected: false,
  unreadTotal: 0,
};

export const connectInboxRealtime = createAsyncThunk<void, void, { state: RootState }>(
  "messages/connectInboxRealtime",
  async (_, { getState, dispatch }) => {
    const token = getState().auth.token;
    const socket = getSocket(token);
    if (!socket) return;

    const anySocket = socket as any;
    if (anySocket.__inboxHandlersRegistered) return;
    anySocket.__inboxHandlersRegistered = true;

    socket.on("socket:ready", () => {
      dispatch(messagesSlice.actions.setConnected(true));
    });

    socket.on("presence:update", (payload: { userId: string; online: boolean }) => {
      dispatch(messagesSlice.actions.presenceUpdate(payload));
    });

    socket.on(
      "inbox:typing",
      (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
        dispatch(messagesSlice.actions.typingUpdate(payload));
      }
    );

    socket.on(
      "inbox:read",
      (payload: { conversationId: string; userId: string; at: string }) => {
        dispatch(messagesSlice.actions.conversationRead(payload));
      }
    );

    socket.on("inbox:unreadCount", (payload: { unreadCount: number }) => {
      if (typeof payload?.unreadCount === "number") {
        dispatch(messagesSlice.actions.setUnreadTotal(payload.unreadCount));
      }
    });

    socket.on(
      "inbox:message:new",
      (payload: {
        conversationId: string;
        message: {
          id: string;
          senderId: string;
          content?: string | null;
          type?: string;
          payload?: any;
          createdAt?: string;
          updatedAt?: string;
        };
        clientMessageId?: string | null;
      }) => {
        dispatch(
          messagesSlice.actions.incomingMessage({
            conversationId: payload.conversationId,
            message: {
              ...payload.message,
              clientMessageId: payload.clientMessageId ?? null,
            },
          })
        );

        // Ask server for unread count (badge hydration)
        socket.emit("inbox:unreadCount");
      }
    );

    socket.on(
      "inbox:message:updated",
      (payload: {
        conversationId: string;
        message: { id: string; content?: string | null; payload?: any; isEdited?: boolean; updatedAt?: string };
      }) => {
        dispatch(messagesSlice.actions.messageUpdated(payload));
      }
    );

    socket.on(
      "inbox:message:deleted",
      (payload: { conversationId: string; messageId: string; scope: "all" | "self" }) => {
        dispatch(messagesSlice.actions.messageDeleted(payload));
      }
    );

    socket.on("connect_error", () => {
      dispatch(messagesSlice.actions.setConnected(false));
    });

    socket.on("disconnect", () => {
      dispatch(messagesSlice.actions.setConnected(false));
    });
  }
);

export const fetchConversations = createAsyncThunk<
  { conversations: ConversationApi[] },
  { archived?: boolean },
  { state: RootState }
>("messages/fetchConversations", async ({ archived = false }) => {
  const res = await api.get(`/inbox/conversations?archived=${archived ? "true" : "false"}`);
  return res.data;
});

export const fetchMessagesPage = createAsyncThunk<
  { conversationId: string; messages: MessageApi[]; nextCursor: string | null },
  { conversationId: string; cursor?: string | null; limit?: number },
  { state: RootState }
>("messages/fetchMessagesPage", async ({ conversationId, cursor = null, limit = 30 }) => {
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (cursor) qs.set("cursor", cursor);

  const res = await api.get(
    `/inbox/conversations/${encodeURIComponent(conversationId)}/messages?${qs.toString()}`
  );
  return {
    conversationId,
    messages: res.data.messages as MessageApi[],
    nextCursor: res.data.nextCursor ?? null,
  };
});

export const createOrGetDirectConversation = createAsyncThunk<
  { conversation: { id: string } },
  { otherUserId: string },
  { state: RootState }
>("messages/createOrGetDirectConversation", async ({ otherUserId }) => {
  const res = await api.post(`/inbox/conversations/direct`, { userId: otherUserId });
  return res.data;
});

export const archiveConversation = createAsyncThunk<void, string>(
  "messages/archiveConversation",
  async (conversationId: string) => {
    await api.patch(`/inbox/conversations/${encodeURIComponent(conversationId)}/archive`);
  }
);

export const unarchiveConversation = createAsyncThunk<void, string>(
  "messages/unarchiveConversation",
  async (conversationId: string) => {
    await api.patch(`/inbox/conversations/${encodeURIComponent(conversationId)}/unarchive`);
  }
);

export const deleteConversation = createAsyncThunk<void, string>(
  "messages/deleteConversation",
  async (conversationId: string) => {
    await api.delete(`/inbox/conversations/${encodeURIComponent(conversationId)}`);
  }
);

export const setCurrentConversation = createAsyncThunk<void, string | null, { state: RootState }>(
  "messages/setCurrentConversation",
  async (conversationId, { getState, dispatch }) => {
    dispatch(messagesSlice.actions.setCurrentConversation(conversationId));
    const token = getState().auth.token;
    const socket = getSocket(token);
    if (!socket) return;

    if (conversationId) {
      socket.emit("inbox:join", { conversationId });
    }
  }
);

export const leaveConversation = createAsyncThunk<void, string, { state: RootState }>(
  "messages/leaveConversation",
  async (conversationId, { getState }) => {
    const token = getState().auth.token;
    const socket = getSocket(token);
    if (!socket) return;
    socket.emit("inbox:leave", { conversationId });
  }
);

export const setTyping = createAsyncThunk<
  void,
  { conversationId: string; isTyping: boolean },
  { state: RootState }
>("messages/setTyping", async ({ conversationId, isTyping }, { getState }) => {
  const token = getState().auth.token;
  const socket = getSocket(token);
  if (!socket) return;
  socket.emit("inbox:typing", { conversationId, isTyping });
});

export const subscribePresence = createAsyncThunk<void, { userIds: string[] }, { state: RootState }>(
  "messages/subscribePresence",
  async ({ userIds }, { getState }) => {
    const token = getState().auth.token;
    const socket = getSocket(token);
    if (!socket) return;
    socket.emit("presence:subscribe", { userIds });
  }
);

export const sendMessageRealtime = createAsyncThunk<
  void,
  {
    conversationId: string;
    content: string;
    type?: MessageType;
    image?: string;
    sticker?: string;
    poll?: any;
    event?: any;
    location?: Message["location"];
    voiceDuration?: number;
    voiceUrl?: string;
    fileUrl?: string;
    fileName?: string;
    fileMime?: string;
    fileSize?: number;
  },
  { state: RootState }
>("messages/sendMessageRealtime", async (args, { getState, dispatch }) => {
  const token = getState().auth.token;
  const myId = getState().auth.user?.id ?? "";
  const socket = getSocket(token);
  if (!socket) return;

  const clientMessageId = uuidv4();

  dispatch(
    messagesSlice.actions.optimisticMessage({
      conversationId: args.conversationId,
      message: {
        id: clientMessageId,
        clientMessageId,
        senderId: myId,
        content: args.content,
        type: args.type ?? "text",
        status: "sending",
        timestamp: "Just now",
        isRead: false,
        image: args.image,
        sticker: args.sticker,
        poll: args.poll,
        event: args.event,
        location: args.location,
        voiceDuration: args.voiceDuration,
        voiceUrl: args.voiceUrl,
        fileUrl: args.fileUrl,
        fileName: args.fileName,
        fileMime: args.fileMime,
        fileSize: args.fileSize,
      },
    })
  );

  const payload: any = {};
  if (args.type === "image" && args.image) payload.url = args.image;
  if (args.type === "location" && args.location) payload.location = args.location;
  if (args.type === "voice") {
    if (args.voiceDuration) payload.duration = args.voiceDuration;
    if (args.voiceUrl) payload.url = args.voiceUrl;
  }
  if (args.type === "file") {
    if (args.fileUrl) payload.url = args.fileUrl;
    if (args.fileName) payload.name = args.fileName;
    if (args.fileMime) payload.mimetype = args.fileMime;
    if (typeof args.fileSize === "number") payload.size = args.fileSize;
  }
  if (args.type === "poll" && args.poll) payload.poll = args.poll;
  if (args.type === "event" && args.event) payload.event = args.event;

  socket.emit("inbox:message:send", {
    clientMessageId,
    conversationId: args.conversationId,
    type: args.type,
    content: args.content,
    payload: Object.keys(payload).length ? payload : null,
  });
});

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
    },

    setUnreadTotal: (state, action: PayloadAction<number>) => {
      state.unreadTotal = Math.max(0, Number(action.payload) || 0);
    },

    setCurrentConversation: (state, action: PayloadAction<string | null>) => {
      state.currentConversation = action.payload;
      if (action.payload) {
        const conv = state.conversations.find((c) => c.id === action.payload);
        if (conv) conv.unreadCount = 0;
      }
    },

    presenceUpdate: (state, action: PayloadAction<{ userId: string; online: boolean }>) => {
      for (const conv of state.conversations) {
        if (conv.userId === action.payload.userId) {
          conv.isOnline = action.payload.online;
          if (!action.payload.online) conv.lastSeen = "recently";
        }
      }
    },

    typingUpdate: (
      state,
      action: PayloadAction<{ conversationId: string; userId: string; isTyping: boolean }>
    ) => {
      const { conversationId, userId, isTyping } = action.payload;
      state.typingByConversation[conversationId] = state.typingByConversation[conversationId] ?? {};
      state.typingByConversation[conversationId][userId] = isTyping;
    },

    conversationRead: (state, action: PayloadAction<{ conversationId: string; userId: string; at: string }>) => {
      const { conversationId } = action.payload;
      const list = state.messages[conversationId] ?? [];
      for (const m of list) {
        if (m.status === "sent" || m.status === "delivered") {
          m.status = "seen";
          m.isRead = true;
        }
      }
      const conv = state.conversations.find((c) => c.id === conversationId);
      if (conv) conv.unreadCount = 0;

      state.unreadTotal = state.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    },

    optimisticMessage: (state, action: PayloadAction<{ conversationId: string; message: Message }>) => {
      const { conversationId, message } = action.payload;
      state.messages[conversationId] = state.messages[conversationId] ?? [];
      state.messages[conversationId].push(message);

      const conv = state.conversations.find((c) => c.id === conversationId);
      if (conv) {
        conv.lastMessage = message.type === "text" ? message.content : `Sent a ${message.type}`;
        conv.timestamp = "Just now";
      }
    },

    incomingMessage: (
      state,
      action: PayloadAction<{
        conversationId: string;
        message: {
          id: string;
          senderId: string;
          content?: string | null;
          type?: string;
          payload?: any;
          createdAt?: any;
          isDeleted?: boolean;
          deletedForAll?: boolean;
          clientMessageId?: string | null;
        };
      }>
    ) => {
      const { conversationId } = action.payload;
      const msg = mapIncomingMessage(action.payload.message);

      // For demo UX: approximate delivery based on presence.
      // Back-end writes delivered when recipient is online.
      const conv = state.conversations.find((c) => c.id === conversationId);
      const deliveryStatus: MessageStatus = conv?.isOnline ? "delivered" : "sent";

      state.messages[conversationId] = state.messages[conversationId] ?? [];

      if (msg.clientMessageId) {
        const idx = state.messages[conversationId].findIndex(
          (m) => m.clientMessageId && m.clientMessageId === msg.clientMessageId
        );
        if (idx >= 0) {
          state.messages[conversationId][idx] = { ...msg, status: deliveryStatus };
        } else {
          state.messages[conversationId].push({ ...msg, status: deliveryStatus });
        }
      } else {
        state.messages[conversationId].push({ ...msg, status: deliveryStatus });
      }
      if (conv) {
        conv.lastMessage = msg.type === "text" ? msg.content : `Sent a ${msg.type}`;
        conv.timestamp = msg.timestamp;
        if (state.currentConversation !== conversationId) conv.unreadCount += 1;
      }

      state.unreadTotal = state.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    },

    messageUpdated: (
      state,
      action: PayloadAction<{ conversationId: string; message: { id: string; content?: string | null; payload?: any } }>
    ) => {
      const { conversationId, message } = action.payload;
      const list = state.messages[conversationId] ?? [];
      const idx = list.findIndex((m) => m.id === message.id);
      if (idx >= 0) {
        const next = { ...list[idx] };
        if (typeof message.content === "string") next.content = message.content;
        if (message.payload) {
          const payload = message.payload;
          next.type = normalizeIncomingType(next.type, payload);
          next.image = payload?.url ?? payload?.imageUrl ?? next.image;
          next.location = payload?.location ?? next.location;
          next.voiceDuration = payload?.duration ?? next.voiceDuration;
          next.poll = payload?.poll ?? next.poll;
          next.event = payload?.event ?? next.event;
        }
        list[idx] = next;
      }
    },

    messageDeleted: (state, action: PayloadAction<{ conversationId: string; messageId: string; scope: "all" | "self" }>) => {
      const { conversationId, messageId, scope } = action.payload;
      const list = state.messages[conversationId] ?? [];
      const idx = list.findIndex((m) => m.id === messageId);
      if (idx >= 0) {
        if (scope === "all") {
          list[idx].isDeleted = true;
          list[idx].content = "(deleted)";
        } else {
          list.splice(idx, 1);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.status = "succeeded";
        const rows = action.payload.conversations ?? [];
        const mapped = rows.map((c) => {
          const username =
            c.otherUser?.display_name ||
            c.otherUser?.username ||
            c.title ||
            (c.isGroup ? "Group" : "Conversation");

          return {
            id: c.id,
            userId: c.otherUser?.id ?? "",
            username,
            avatar: c.otherUser?.avatar_url ?? undefined,
            lastMessage: c.lastMessage?.content ?? "",
            timestamp: formatTimeAgo(c.lastMessage?.createdAt ?? null),
            unreadCount: c.unreadCount ?? 0,
            isArchived: Boolean(c.participantState?.isArchived),
            isOnline: false,
          };
        });

        // Merge results instead of replacing, so Inbox can show
        // active + archived sections without breaking existing screens.
        const byId = new Map(state.conversations.map((c) => [c.id, c] as const));
        for (const conv of mapped) {
          const prev = byId.get(conv.id);
          byId.set(conv.id, {
            ...(prev ?? {}),
            ...conv,
            // preserve live presence if already known
            isOnline: prev?.isOnline ?? conv.isOnline,
            lastSeen: prev?.lastSeen,
          });
        }
        state.conversations = Array.from(byId.values());

        state.unreadTotal = state.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      })
      .addCase(fetchConversations.rejected, (state, action: any) => {
        state.status = "failed";
        state.error = action?.error?.message ?? "Failed";
      })
      .addCase(fetchMessagesPage.fulfilled, (state, action) => {
        const { conversationId, messages } = action.payload;
        const mapped = (messages ?? [])
          .map((m) =>
            mapIncomingMessage({
              id: m.id,
              senderId: m.senderId,
              content: m.content,
              type: m.type,
              payload: m.payload,
              createdAt: m.createdAt,
              isDeleted: m.isDeleted,
              deletedForAll: m.deletedForAll,
            })
          )
          .reverse();

        state.messages[conversationId] = mapped;
      })
      .addCase(archiveConversation.fulfilled, (state, action) => {
        const id = action.meta.arg;
        const conv = state.conversations.find((c) => c.id === id);
        if (conv) conv.isArchived = true;
      })
      .addCase(unarchiveConversation.fulfilled, (state, action) => {
        const id = action.meta.arg;
        const conv = state.conversations.find((c) => c.id === id);
        if (conv) conv.isArchived = false;
      })
      .addCase(deleteConversation.fulfilled, (state, action) => {
        const id = action.meta.arg;
        state.conversations = state.conversations.filter((c) => c.id !== id);
        delete state.messages[id];
        if (state.currentConversation === id) state.currentConversation = null;
      });
  },
});

export const selectTypingForConversation = (state: RootState, conversationId: string) => {
  return state.messages.typingByConversation[conversationId] ?? {};
};

export default messagesSlice.reducer;
