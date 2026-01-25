import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import userReducer from './features/user/userSlice';
import postsReducer from './features/posts/postsSlice';
import storiesReducer from './features/stories/storiesSlice';
import messagesReducer from './features/messages/messagesSlice';
import notificationsReducer from './features/notifications/notificationsSlice';
import settingsReducer from './features/settings/settingsSlice';
import communitiesReducer from './features/communities/communitiesSlice';
import textSizeReducer from './features/textSize/textSizeSlice';
import accessibilityReducer from './features/accessibility/accessibilitySlice';
import layoutDensityReducer from './features/layoutDensity/layoutDensitySlice';
import { saveTextSize } from './utils/persistTextSize';
import { saveAccessibility } from './utils/persistAccessibility';
import { saveLayoutDensity } from './utils/persistLayoutDensity';
import type { AccessibilityPersistedState } from './utils/persistAccessibility';
import type { LayoutDensity } from './utils/persistLayoutDensity';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    posts: postsReducer,
    stories: storiesReducer,
    messages: messagesReducer,
    notifications: notificationsReducer,
    settings: settingsReducer,
    communities: communitiesReducer,
    textSize: textSizeReducer,
    accessibility: accessibilityReducer,
    layoutDensity: layoutDensityReducer,
  },
});

// ... (imports)
import { saveLanguage } from './utils/persistLanguage';
// ...

// --- Persistence Listener ---
let currentFontSize: number;
let currentAccessibilityState: AccessibilityPersistedState;
let currentLayoutDensity: LayoutDensity;
let currentLanguage: string;

store.subscribe(() => {
  const state = store.getState();

  // ... (existing persistence for font size, accessibility, layout density)

  // Persist language
  const previousLanguage = currentLanguage;
  const newLanguage = state.settings.language;

  if (previousLanguage !== newLanguage) {
    currentLanguage = newLanguage;
    saveLanguage(newLanguage);
  }
});
// ... (rest of the file)


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;