import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  theme: 'light' | 'dark';
  language: 'en' | 'fr' | 'es' | 'ar';
  notifications: {
    likes: boolean;
    comments: boolean;
    follows: boolean;
    mentions: boolean;
    reposts: boolean;
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
}

const initialState: SettingsState = {
  theme: 'light',
  language: 'en',
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
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setLanguage: (state, action: PayloadAction<'en' | 'fr' | 'es' | 'ar'>) => {
      state.language = action.payload;
    },
    toggleNotification: (state, action: PayloadAction<keyof typeof initialState.notifications>) => {
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
});

export const {
  toggleTheme,
  setLanguage,
  toggleNotification,
  toggleAllNotifications,
  togglePrivacySetting,
  updateNotificationChannel,
} = settingsSlice.actions;
export default settingsSlice.reducer;