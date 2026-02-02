import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { getSocket } from '../../realtime/socket';

type ServerNotification = {
  id: string;
  code: string | null;
  typeName?: string | null;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  sender?:
    | {
        id: string;
        username: string;
        displayName?: string | null;
        avatarUrl?: string | null;
      }
    | null;
  sourceId?: string | null;
  sourceType?: string | null;
  metadata?: any;
  createdAt: string;
};

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'repost' | 'message' | 'call' | 'system';
  userId?: string;
  username: string;
  avatar?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  postId?: string;
  title?: string;
  metadata?: any;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
};

const formatTimeAgo = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async () => {
    const res = await api.get('/notifications?limit=50');
    return res.data as {
      notifications: ServerNotification[];
      nextCursor?: string | null;
    };
  }
);

export const fetchUnreadNotificationsCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async () => {
    const res = await api.get('/notifications/unread-count');
    return res.data as { unreadCount: number };
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markReadRemote',
  async (id: string, thunkApi) => {
    const state = thunkApi.getState() as any;
    const token = state?.auth?.token ?? null;
    const socket = getSocket(token);

    if (socket && socket.connected) {
      const resp = await new Promise<{ ok: boolean; unreadCount?: number }>((resolve) => {
        socket.emit('notification:read', { notificationId: id }, (ack: any) => {
          resolve({ ok: Boolean(ack?.ok), unreadCount: ack?.unreadCount });
        });
      });

      if (resp.ok) return { id, unreadCount: resp.unreadCount };
    }

    const res = await api.patch(`/notifications/${encodeURIComponent(id)}/read`);
    return { id, unreadCount: (res.data as any)?.unreadCount } as { id: string; unreadCount?: number };
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllReadRemote',
  async (_: void, thunkApi) => {
    const state = thunkApi.getState() as any;
    const token = state?.auth?.token ?? null;
    const socket = getSocket(token);

    if (socket && socket.connected) {
      const resp = await new Promise<{ ok: boolean; unreadCount?: number }>((resolve) => {
        socket.emit('notification:readAll', {}, (ack: any) => {
          resolve({ ok: Boolean(ack?.ok), unreadCount: ack?.unreadCount });
        });
      });

      if (resp.ok) return { unreadCount: resp.unreadCount };
    }

    const res = await api.patch('/notifications/read-all');
    return { unreadCount: (res.data as any)?.unreadCount } as { unreadCount?: number };
  }
);

const toUiType = (code: string | null | undefined): Notification['type'] => {
  const c = String(code ?? '').toUpperCase();
  if (c.includes('CALL')) return 'call';
  if (c.includes('INBOX') || c.includes('MESSAGE')) return 'message';
  if (c.includes('FOLLOW')) return 'follow';
  if (c.includes('MENTION')) return 'mention';
  if (c.includes('REPOST')) return 'repost';
  if (c.includes('COMMENT')) return 'comment';
  if (c.includes('LIKE')) return 'like';
  if (c.includes('POST')) return 'system';
  return 'system';
};

const mapServerToUi = (n: ServerNotification): Notification => {
  const sender = n.sender ?? null;
  return {
    id: n.id,
    type: toUiType(n.code),
    userId: sender?.id,
    username: sender?.displayName || sender?.username || 'System',
    avatar: sender?.avatarUrl || undefined,
    content: n.message,
    timestamp: formatTimeAgo(n.createdAt),
    isRead: Boolean(n.isRead),
    title: n.title,
    metadata: {
      ...(n.metadata ?? null),
      code: n.code,
      sourceId: n.sourceId ?? null,
      sourceType: n.sourceType ?? null,
      readAt: n.readAt ?? null,
    },
  };
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'isRead'>>) => {
      const newNotification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: 'Just now',
        isRead: false,
      };
      state.notifications.unshift(newNotification);
      state.unreadCount += 1;
    },
    addRealtimeNotification: (
      state,
      action: PayloadAction<{ kind: string; title?: string; message?: string; metadata?: any }>
    ) => {
      const kind = String(action.payload.kind ?? 'system');
      const type: Notification['type'] =
        kind.includes('call') ? 'call' : kind.includes('message') ? 'message' : 'system';

      state.notifications.unshift({
        id: Date.now().toString(),
        type,
        username: 'System',
        content: action.payload.message ?? action.payload.title ?? kind,
        timestamp: 'Just now',
        isRead: false,
        title: action.payload.title,
        metadata: action.payload.metadata,
      });
      state.unreadCount += 1;
    },
    upsertServerNotification: (
      state,
      action: PayloadAction<{ notification: ServerNotification; unreadCount?: number }>
    ) => {
      const ui = mapServerToUi(action.payload.notification);
      const existingIndex = state.notifications.findIndex((x) => x.id === ui.id);
      if (existingIndex !== -1) state.notifications.splice(existingIndex, 1);
      state.notifications.unshift(ui);
      state.notifications = state.notifications.slice(0, 200);

      if (typeof action.payload.unreadCount === 'number') {
        state.unreadCount = Math.max(0, action.payload.unreadCount);
      } else {
        state.unreadCount = state.notifications.filter((n) => !n.isRead).length;
      }
    },
    applySocketRead: (
      state,
      action: PayloadAction<{ notificationId: string; unreadCount?: number }>
    ) => {
      const n = state.notifications.find((x) => x.id === action.payload.notificationId);
      if (n) n.isRead = true;
      if (typeof action.payload.unreadCount === 'number') {
        state.unreadCount = Math.max(0, action.payload.unreadCount);
      } else {
        state.unreadCount = state.notifications.filter((x) => !x.isRead).length;
      }
    },
    applySocketReadAll: (state, action: PayloadAction<{ unreadCount?: number }>) => {
      state.notifications.forEach((n) => (n.isRead = true));
      state.unreadCount = typeof action.payload.unreadCount === 'number' ? action.payload.unreadCount : 0;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = Math.max(0, Number(action.payload) || 0);
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(n => { n.isRead = true; });
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      const rows = action.payload.notifications ?? [];
      state.notifications = rows.map(mapServerToUi);
      state.unreadCount = state.notifications.filter((n) => !n.isRead).length;
    });

    builder.addCase(fetchUnreadNotificationsCount.fulfilled, (state, action) => {
      state.unreadCount = Math.max(0, Number(action.payload.unreadCount) || 0);
    });

    builder.addCase(markNotificationAsRead.fulfilled, (state, action) => {
      const id = action.payload.id;
      const n = state.notifications.find((x) => x.id === id);
      if (n && !n.isRead) {
        n.isRead = true;
      }
      if (typeof action.payload.unreadCount === 'number') {
        state.unreadCount = Math.max(0, action.payload.unreadCount);
      } else {
        state.unreadCount = state.notifications.filter((x) => !x.isRead).length;
      }
    });

    builder.addCase(markAllNotificationsAsRead.fulfilled, (state) => {
      state.notifications.forEach((n) => (n.isRead = true));
      state.unreadCount = 0;
    });
  },
});

export const {
  addNotification,
  addRealtimeNotification,
  upsertServerNotification,
  applySocketRead,
  applySocketReadAll,
  setUnreadCount,
  markAsRead,
  markAllAsRead,
} = notificationsSlice.actions;
export default notificationsSlice.reducer;
