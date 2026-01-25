import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type MessageType = 'text' | 'sticker' | 'poll' | 'event' | 'location' | 'voice' | 'image';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'seen';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  timestamp: string;
  isRead: boolean;
  image?: string;
  sticker?: string;
  poll?: {
    question: string;
    options: { id: string; text: string; votes: number }[];
    totalVotes: number;
    userVote?: string;
  };
  event?: {
    title: string;
    date: string;
    time: string;
    location?: string;
  };
  location?: {
    name: string;
    lat: number;
    lng: number;
  };
  voiceDuration?: number;
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
  messages: { [conversationId: string]: Message[] };
  currentConversation: string | null;
}

const initialState: MessagesState = {
  conversations: [
    {
      id: '1',
      userId: '2',
      username: 'jane_smith',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      lastMessage: 'Thanks for sharing that! 😊',
      timestamp: '10m ago',
      unreadCount: 2,
      isArchived: false,
      isOnline: true,
    },
    {
      id: '2',
      userId: '3',
      username: 'mike_wilson',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      lastMessage: 'See you at the gym tomorrow!',
      timestamp: '2h ago',
      unreadCount: 0,
      isArchived: false,
      isOnline: false,
      lastSeen: '1h ago',
    },
  ],
  messages: {
    '1': [
      {
        id: '1',
        senderId: '2',
        receiverId: '1',
        content: 'Hey! How are you?',
        type: 'text',
        status: 'seen',
        timestamp: '1h ago',
        isRead: true,
      },
      {
        id: '2',
        senderId: '1',
        receiverId: '2',
        content: 'I\'m good! How about you?',
        type: 'text',
        status: 'seen',
        timestamp: '55m ago',
        isRead: true,
      },
      {
        id: '3',
        senderId: '2',
        receiverId: '1',
        content: 'Thanks for sharing that! 😊',
        type: 'text',
        status: 'delivered',
        timestamp: '10m ago',
        isRead: false,
      },
    ],
  },
  currentConversation: null,
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    sendMessage: (state, action: PayloadAction<{ 
      conversationId: string; 
      content: string; 
      type?: MessageType;
      image?: string;
      sticker?: string;
      poll?: Message['poll'];
      event?: Message['event'];
      location?: Message['location'];
      voiceDuration?: number;
    }>) => {
      const { conversationId, content, type = 'text', image, sticker, poll, event, location, voiceDuration } = action.payload;
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: '1',
        receiverId: conversationId,
        content,
        type,
        status: 'sent',
        image,
        sticker,
        poll,
        event,
        location,
        voiceDuration,
        timestamp: 'Just now',
        isRead: false,
      };

      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(newMessage);

      const conversation = state.conversations.find(c => c.id === conversationId);
      if (conversation) {
        conversation.lastMessage = type === 'text' ? content : `Sent a ${type}`;
        conversation.timestamp = 'Just now';
      }
    },
    deleteConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter(c => c.id !== action.payload);
      delete state.messages[action.payload];
    },
    setCurrentConversation: (state, action: PayloadAction<string | null>) => {
      state.currentConversation = action.payload;
      if (action.payload) {
        const conversation = state.conversations.find(c => c.id === action.payload);
        if (conversation) {
          conversation.unreadCount = 0;
        }
        const messages = state.messages[action.payload];
        if (messages) {
          messages.forEach(m => {
            m.isRead = true;
          });
        }
      }
    },
    archiveConversation: (state, action: PayloadAction<string>) => {
      const conversation = state.conversations.find(c => c.id === action.payload);
      if (conversation) {
        conversation.isArchived = true;
      }
    },
    unarchiveConversation: (state, action: PayloadAction<string>) => {
      const conversation = state.conversations.find(c => c.id === action.payload);
      if (conversation) {
        conversation.isArchived = false;
      }
    },
  },
});

export const { sendMessage, deleteConversation, setCurrentConversation, archiveConversation, unarchiveConversation } = messagesSlice.actions;
export default messagesSlice.reducer;
