import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Story {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  image: string;
  timestamp: string;
  isViewed: boolean;
  likes: number;
  isLiked: boolean;
}

interface StoriesState {
  stories: Story[];
  currentStoryIndex: number | null;
}

const initialState: StoriesState = {
  stories: [
    {
      id: '1',
      userId: '2',
      username: 'jane_smith',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800',
      timestamp: '2h ago',
      isViewed: false,
      likes: 45,
      isLiked: false,
    },
    {
      id: '2',
      userId: '3',
      username: 'mike_wilson',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
      timestamp: '5h ago',
      isViewed: false,
      likes: 67,
      isLiked: false,
    },
  ],
  currentStoryIndex: null,
};

const storiesSlice = createSlice({
  name: 'stories',
  initialState,
  reducers: {
    addStory: (state, action: PayloadAction<{ image: string }>) => {
      const newStory: Story = {
        id: Date.now().toString(),
        userId: '1',
        username: 'john_doe',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        image: action.payload.image,
        timestamp: 'Just now',
        isViewed: false,
        likes: 0,
        isLiked: false,
      };
      state.stories.unshift(newStory);
    },
    viewStory: (state, action: PayloadAction<string>) => {
      const story = state.stories.find(s => s.id === action.payload);
      if (story) {
        story.isViewed = true;
      }
    },
    toggleStoryLike: (state, action: PayloadAction<string>) => {
      const story = state.stories.find(s => s.id === action.payload);
      if (story) {
        story.isLiked = !story.isLiked;
        story.likes += story.isLiked ? 1 : -1;
      }
    },
    setCurrentStoryIndex: (state, action: PayloadAction<number | null>) => {
      state.currentStoryIndex = action.payload;
    },
  },
});

export const { addStory, viewStory, toggleStoryLike, setCurrentStoryIndex } = storiesSlice.actions;
export default storiesSlice.reducer;
