import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { loadLanguage } from '../../utils/persistLanguage';
import api from '../../api/axios';

/** Per-type notification preferences stored on the server (GET/PATCH /notifications/settings). */
export interface NotificationPreferences {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  mentions: boolean;
  reposts: boolean;
}

const PREFERENCE_KEYS = ['likes', 'comments', 'follows', 'mentions', 'reposts'] as const;

const getErrorMessage = (error: unknown, fallback: string) => {
  const e = error as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || fallback;
};

export const fetchNotificationSettings = createAsyncThunk<
  NotificationPreferences,
  void,
  { rejectValue: string }
>('settings/fetchNotificationSettings', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/notifications/settings');
    return res.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, 'Failed to load notification settings'));
  }
});

/** Saves any subset of the preferences. The UI updates immediately; a failure restores the previous values. */
export const updateNotificationSettings = createAsyncThunk<
  NotificationPreferences,
  Partial<NotificationPreferences>,
  { rejectValue: string }
>('settings/updateNotificationSettings', async (changes, { rejectWithValue }) => {
  try {
    const res = await api.patch('/notifications/settings', changes);
    return res.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, 'Failed to save notification settings'));
  }
});

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'fr' | 'es' | 'ar' | 'de';
  notifications: {
    likes: boolean;
    comments: boolean;
    follows: boolean;
    mentions: boolean;
    reposts: boolean;
    /** Master switch, derived: on while at least one type is enabled. */
    all: boolean;
    channels?: {
      push: boolean;
      email: boolean;
      inApp: boolean;
    };
  };
  privacy: {
    allowSave: boolean;
    allowRepost: boolean;
  };
  /** Values to restore if an in-flight preferences save fails. */
  notificationsBeforeSave: NotificationPreferences | null;
}

const applyPreferences = (
  notifications: SettingsState['notifications'],
  preferences: Partial<NotificationPreferences>
) => {
  for (const key of PREFERENCE_KEYS) {
    const value = preferences[key];
    if (typeof value === 'boolean') notifications[key] = value;
  }
  notifications.all = PREFERENCE_KEYS.some((key) => notifications[key]);
};

/** The theme saved by next-themes (localStorage "theme"). */
const loadTheme = (): SettingsState['theme'] => {
  try {
    const saved = localStorage.getItem('theme');
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
};

const initialState: SettingsState = {
  theme: loadTheme(),
  language: (loadLanguage() as SettingsState['language']) || 'en',
  notifications: {
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    reposts: true,
    all: true,
  },
  privacy: {
    allowSave: true,
    allowRepost: true,
  },
  notificationsBeforeSave: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'en' | 'fr' | 'es' | 'ar' | 'de'>) => {
      state.language = action.payload;
    },
    toggleNotification: (state, action: PayloadAction<(typeof PREFERENCE_KEYS)[number] | 'all'>) => {
      state.notifications[action.payload] = !state.notifications[action.payload];
    },
    toggleAllNotifications: (state) => {
      state.notifications.all = !state.notifications.all;
      const value = state.notifications.all;
      state.notifications.likes = value;
      state.notifications.comments = value;
      state.notifications.follows = value;
      state.notifications.mentions = value;
      state.notifications.reposts = value;
    },
    togglePrivacySetting: (state, action: PayloadAction<keyof typeof initialState.privacy>) => {
      state.privacy[action.payload] = !state.privacy[action.payload];
    },
    updateNotificationChannel: (state, action: PayloadAction<{ channel: 'push' | 'email' | 'inApp'; value: boolean }>) => {
      if (!state.notifications.channels) {
        state.notifications.channels = { push: true, email: false, inApp: true };
      }
      state.notifications.channels[action.payload.channel] = action.payload.value;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        applyPreferences(state.notifications, action.payload);
      })
      .addCase(updateNotificationSettings.pending, (state, action) => {
        const { likes, comments, follows, mentions, reposts } = state.notifications;
        // Keep the oldest snapshot if several saves overlap.
        state.notificationsBeforeSave ??= { likes, comments, follows, mentions, reposts };
        applyPreferences(state.notifications, action.meta.arg);
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.notificationsBeforeSave = null;
        applyPreferences(state.notifications, action.payload);
      })
      .addCase(updateNotificationSettings.rejected, (state) => {
        if (state.notificationsBeforeSave) {
          applyPreferences(state.notifications, state.notificationsBeforeSave);
        }
        state.notificationsBeforeSave = null;
      });
  },
});

export const {
  setTheme,
  setLanguage,
  toggleNotification,
  toggleAllNotifications,
  togglePrivacySetting,
  updateNotificationChannel,
} = settingsSlice.actions;
export default settingsSlice.reducer;
