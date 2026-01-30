import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as storiesApi from '../../api/storiesApi';

// Define the shape of a story as used in the UI
// We adapt the backend response to this shape to maintain compatibility
export interface Story {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  image: string;
  timestamp: string; // We'll assume 'image' maps to 'content_url'
  isViewed: boolean;
  likes: number;
  isLiked: boolean;
}

interface StoriesState {
  stories: Story[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  currentStoryIndex: number | null;
}

const initialState: StoriesState = {
  stories: [],
  status: 'idle',
  error: null,
  currentStoryIndex: null,
};

// --- Async Thunks ---

// Fetch all stories
export const fetchStories = createAsyncThunk(
  'stories/fetchStories',
  async () => {
    const data = await storiesApi.getStories();
    // Transform backend data to frontend model
    return data.map(story => ({
      id: story.id,
      userId: story.user_id,
      username: story.user.username,
      avatar: story.user.avatar_url || undefined,
      image: story.content_url,
      timestamp: new Date(story.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), // Simple formatting
      isViewed: story.has_viewed,
      likes: story._count.likes,
      isLiked: story.has_liked,
    }));
  }
);

// Add a new story
export const addStory = createAsyncThunk(
  'stories/addStory',
  async ({ image }: { image: string }) => {
    const data = await storiesApi.createStory({
      content_url: image,
      content_type: 'image', // Default to image for now
      visibility: 'public', // Default visibility
      duration_hours: 24
    });

    // Transform response to UI model
    return {
      id: data.id,
      userId: data.user_id,
      username: data.user.username,
      avatar: data.user.avatar_url || undefined,
      image: data.content_url,
      timestamp: 'Just now',
      isViewed: false,
      likes: 0,
      isLiked: false,
    };
  }
);

// View a story
export const viewStory = createAsyncThunk(
  'stories/viewStory',
  async (storyId: string) => {
    await storiesApi.viewStory(storyId);
    return storyId;
  }
);

// Toggle Like
export const toggleStoryLike = createAsyncThunk(
  'stories/toggleLike',
  async (storyId: string, { getState }) => {
    const state = getState() as { stories: StoriesState };
    const story = state.stories.stories.find(s => s.id === storyId);

    if (story?.isLiked) {
      await storiesApi.unlikeStory(storyId);
      return { storyId, isLiked: false };
    } else {
      await storiesApi.likeStory(storyId);
      return { storyId, isLiked: true };
    }
  }
);


const storiesSlice = createSlice({
  name: 'stories',
  initialState,
  reducers: {
    setCurrentStoryIndex: (state, action: PayloadAction<number | null>) => {
      state.currentStoryIndex = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Stories
      .addCase(fetchStories.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchStories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.stories = action.payload;
      })
      .addCase(fetchStories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch stories';
      })
      // Add Story
      .addCase(addStory.fulfilled, (state, action) => {
        state.stories.unshift(action.payload);
      })
      // View Story
      .addCase(viewStory.fulfilled, (state, action) => {
        const story = state.stories.find(s => s.id === action.payload);
        if (story) {
          story.isViewed = true;
        }
      })
      // Toggle Like
      .addCase(toggleStoryLike.fulfilled, (state, action) => {
        const { storyId, isLiked } = action.payload;
        const story = state.stories.find(s => s.id === storyId);
        if (story) {
          story.isLiked = isLiked;
          story.likes += isLiked ? 1 : -1;
        }
      });
  },
});

export const { setCurrentStoryIndex } = storiesSlice.actions;
export default storiesSlice.reducer;
