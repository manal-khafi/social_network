import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';

export interface NotificationActor {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

/** Shape returned by GET /notifications and pushed by the "new_notification" socket event. */
export interface Notification {
  id: string;
  /** like | comment | reply | follow | follow_request | follow_accepted | repost | mention | story_* */
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  sourceId: string | null;
  sourceType: string | null;
  metadata: Record<string, unknown> | null;
  actor: NotificationActor | null;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  /** Cursor for the next page; null when everything is loaded. */
  nextCursor: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  nextCursor: null,
  status: 'idle',
  error: null,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const e = error as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || fallback;
};

/** First page when called without a cursor (replaces the list), next page otherwise (appends). */
export const fetchNotifications = createAsyncThunk<
  { notifications: Notification[]; nextCursor: string | null; append: boolean },
  { cursor?: string | null } | void,
  { rejectValue: string }
>('notifications/fetch', async (arg, { rejectWithValue }) => {
  try {
    const cursor = (arg && arg.cursor) || null;
    const res = await api.get('/notifications', {
      params: cursor ? { cursor } : undefined,
    });
    return {
      notifications: res.data?.notifications ?? [],
      nextCursor: res.data?.nextCursor ?? null,
      append: Boolean(cursor),
    };
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, 'Failed to load notifications'));
  }
});

export const fetchUnreadCount = createAsyncThunk<number, void, { rejectValue: string }>(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/notifications/unread-count');
      return Number(res.data?.count ?? 0);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load unread count'));
    }
  }
);

export const markAsRead = createAsyncThunk<
  { id: string; count: number | null },
  string,
  { rejectValue: string }
>('notifications/markAsRead', async (id, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/notifications/${id}/read`);
    return { id, count: typeof res.data?.count === 'number' ? res.data.count : null };
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, 'Failed to mark notification as read'));
  }
});

export const markAllAsRead = createAsyncThunk<void, void, { rejectValue: string }>(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await api.patch('/notifications/read-all');
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to mark notifications as read'));
    }
  }
);

export const deleteNotification = createAsyncThunk<
  { id: string; count: number | null },
  string,
  { rejectValue: string }
>('notifications/delete', async (id, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/notifications/${id}`);
    return { id, count: typeof res.data?.count === 'number' ? res.data.count : null };
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, 'Failed to delete notification'));
  }
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    /** A notification pushed live over the socket ("new_notification"). */
    notificationReceived: (state, action: PayloadAction<Notification>) => {
      const incoming = action.payload;
      if (!incoming?.id || state.notifications.some((n) => n.id === incoming.id)) return;
      state.notifications.unshift(incoming);
      if (!incoming.isRead) state.unreadCount += 1;
    },
    /** Notifications withdrawn by the server ("notification_removed": unlike, unfollow, ...). */
    notificationsRemoved: (state, action: PayloadAction<{ ids: string[]; count?: number }>) => {
      const ids = new Set(action.payload.ids ?? []);
      const removedUnread = state.notifications.filter((n) => ids.has(n.id) && !n.isRead).length;
      state.notifications = state.notifications.filter((n) => !ids.has(n.id));
      state.unreadCount =
        typeof action.payload.count === 'number'
          ? action.payload.count
          : Math.max(0, state.unreadCount - removedUnread);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        const { notifications, nextCursor, append } = action.payload;
        if (append) {
          const known = new Set(state.notifications.map((n) => n.id));
          state.notifications.push(...notifications.filter((n) => !known.has(n.id)));
        } else {
          state.notifications = notifications;
        }
        state.nextCursor = nextCursor;
        state.status = 'succeeded';
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load notifications';
      })

      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })

      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find((n) => n.id === action.payload.id);
        const wasUnread = Boolean(notification && !notification.isRead);
        if (notification) notification.isRead = true;
        state.unreadCount =
          action.payload.count ?? Math.max(0, state.unreadCount - (wasUnread ? 1 : 0));
      })

      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.isRead = true;
        });
        state.unreadCount = 0;
      })

      .addCase(deleteNotification.fulfilled, (state, action) => {
        const removed = state.notifications.find((n) => n.id === action.payload.id);
        state.notifications = state.notifications.filter((n) => n.id !== action.payload.id);
        state.unreadCount =
          action.payload.count ??
          Math.max(0, state.unreadCount - (removed && !removed.isRead ? 1 : 0));
      })

      // Never show one account's notifications to the next one on this browser.
      // Matched by type to avoid importing authSlice (store <-> api import cycle).
      .addMatcher(
        (action): action is { type: string } => action.type === 'auth/logout',
        () => initialState
      );
  },
});

export const { notificationReceived, notificationsRemoved } = notificationsSlice.actions;
export default notificationsSlice.reducer;
