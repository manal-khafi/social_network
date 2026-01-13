import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'repost';
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  postId?: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
}

const initialState: NotificationsState = {
  notifications: [
    {
      id: '1',
      type: 'like',
      userId: '2',
      username: 'jane_smith',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      content: 'liked your post',
      timestamp: '10m ago',
      isRead: false,
      postId: '1',
    },
    {
      id: '2',
      type: 'follow',
      userId: '3',
      username: 'mike_wilson',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      content: 'started following you',
      timestamp: '1h ago',
      isRead: false,
    },
    {
      id: '3',
      type: 'comment',
      userId: '2',
      username: 'jane_smith',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      content: 'commented on your post',
      timestamp: '2h ago',
      isRead: true,
      postId: '1',
    },
  ],
  unreadCount: 2,
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
});

export const { addNotification, markAsRead, markAllAsRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;
