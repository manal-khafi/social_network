import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import userReducer from './features/user/userSlice';
import postsReducer from './features/posts/postsSlice';
import storiesReducer from './features/stories/storiesSlice';
import messagesReducer from './features/messages/messagesSlice';
import notificationsReducer from './features/notifications/notificationsSlice';
import settingsReducer from './features/settings/settingsSlice';
import communitiesReducer from './features/communities/communitiesSlice';

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
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
