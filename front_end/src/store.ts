import { combineReducers, configureStore } from "@reduxjs/toolkit";
import type { UnknownAction } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import userReducer from "./features/user/userSlice";
import postsReducer from "./features/posts/postsSlice";
import storiesReducer from "./features/stories/storiesSlice";
import messagesReducer from "./features/messages/messagesSlice";
import notificationsReducer from "./features/notifications/notificationsSlice";
import settingsReducer from "./features/settings/settingsSlice";
import communitiesReducer from "./features/communities/communitiesSlice";
import textSizeReducer from "./features/textSize/textSizeSlice";
import accessibilityReducer from "./features/accessibility/accessibilitySlice";
import layoutDensityReducer from "./features/layoutDensity/layoutDensitySlice";
import twoFactorAuthReducer from "./features/twoFactorAuth/twoFactorAuthSlice";

import type { AccessibilityPersistedState } from "./utils/persistAccessibility";
import type { LayoutDensity } from "./utils/persistLayoutDensity";
import { saveLanguage } from "./utils/persistLanguage"; // ✅ moved up

const appReducer = combineReducers({
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
  twoFactorAuth: twoFactorAuthReducer,
});

type AppState = ReturnType<typeof appReducer>;

// On logout every slice holding the account's data goes back to its initial
// state, so the next person signing in on this browser never sees the previous
// profile, posts, chats or notifications. Device preferences (theme, language,
// text size, accessibility, density) are kept; auth resets itself.
const rootReducer = (state: AppState | undefined, action: UnknownAction): AppState => {
  if (state && action.type === "auth/logout") {
    const { auth, settings, textSize, accessibility, layoutDensity } = state;
    return appReducer(
      { auth, settings, textSize, accessibility, layoutDensity } as AppState,
      action
    );
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = AppState;
export type AppDispatch = typeof store.dispatch;

// --- Persistence Listener ---
let currentFontSize: number;
let currentAccessibilityState: AccessibilityPersistedState;
let currentLayoutDensity: LayoutDensity;
let currentLanguage: string;

store.subscribe(() => {
  const state = store.getState();

  const previousLanguage = currentLanguage;
  const newLanguage = state.settings.language;

  if (previousLanguage !== newLanguage) {
    currentLanguage = newLanguage;
    saveLanguage(newLanguage);
  }
});
