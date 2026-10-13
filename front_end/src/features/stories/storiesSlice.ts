import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import * as storiesApi from "../../api/storiesApi";
import type { Story, StoryGroup, CreateStoryPayload } from "../../api/storiesApi";
import type { RootState } from "../../store";

export type { Story, StoryGroup } from "../../api/storiesApi";

interface StoriesState {
  groups: StoryGroup[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  creating: boolean;
}

const initialState: StoriesState = {
  groups: [],
  status: "idle",
  error: null,
  creating: false,
};

const locateStory = (state: StoriesState, storyId: string) => {
  for (const group of state.groups) {
    const item = group.items.find((s) => s.id === storyId);
    if (item) return { group, item };
  }
  return null;
};

const recomputeUnseen = (group: StoryGroup) => {
  group.has_unseen = group.items.some((s) => !s.has_viewed);
};

// --- Thunks ---

export const fetchStories = createAsyncThunk("stories/fetch", async () => {
  return storiesApi.getStoriesFeed();
});

export const createStory = createAsyncThunk(
  "stories/create",
  async (payload: CreateStoryPayload) => {
    return storiesApi.createStory(payload);
  }
);

export const markStoryViewed = createAsyncThunk(
  "stories/view",
  async (storyId: string) => {
    await storiesApi.viewStory(storyId);
    return storyId;
  }
);

export const toggleStoryLike = createAsyncThunk(
  "stories/toggleLike",
  async (storyId: string, { getState }) => {
    const found = locateStory((getState() as RootState).stories, storyId);
    const liked = found?.item.has_liked ?? false;
    if (liked) await storiesApi.unlikeStory(storyId);
    else await storiesApi.likeStory(storyId);
    return { storyId, liked: !liked };
  }
);

export const setStoryReaction = createAsyncThunk(
  "stories/react",
  async ({ storyId, emoji }: { storyId: string; emoji: string }, { getState }) => {
    const found = locateStory((getState() as RootState).stories, storyId);
    const current = found?.item.my_reaction ?? null;
    if (current === emoji) {
      await storiesApi.removeStoryReaction(storyId);
      return { storyId, emoji: null as string | null };
    }
    await storiesApi.reactToStory(storyId, emoji);
    return { storyId, emoji };
  }
);

export const replyToStory = createAsyncThunk(
  "stories/reply",
  async ({ storyId, content }: { storyId: string; content: string }) => {
    await storiesApi.replyToStory(storyId, content);
    return storyId;
  }
);

export const shareStory = createAsyncThunk(
  "stories/share",
  async ({
    storyId,
    recipientIds,
    note,
  }: {
    storyId: string;
    recipientIds: string[];
    note?: string;
  }) => {
    return storiesApi.shareStory(storyId, recipientIds, note);
  }
);

export const removeStory = createAsyncThunk(
  "stories/remove",
  async (storyId: string) => {
    await storiesApi.deleteStory(storyId);
    return storyId;
  }
);

const storiesSlice = createSlice({
  name: "stories",
  initialState,
  reducers: {
    // Optimistic local view marking (used by the viewer before the request resolves)
    locallyMarkViewed: (state, action: PayloadAction<string>) => {
      const found = locateStory(state, action.payload);
      if (found) {
        found.item.has_viewed = true;
        recomputeUnseen(found.group);
      }
    },

    // Live counts pushed over the socket (story:view / story:reaction).
    applyRemoteStoryStat: (
      state,
      action: PayloadAction<{ storyId: string; views?: number; reactions?: number }>
    ) => {
      const found = locateStory(state, action.payload.storyId);
      if (!found) return;
      if (typeof action.payload.views === "number") {
        found.item._count.views = action.payload.views;
      }
      if (typeof action.payload.reactions === "number") {
        found.item._count.reactions = action.payload.reactions;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStories.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchStories.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.groups = action.payload;
      })
      .addCase(fetchStories.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load stories";
      })

      .addCase(createStory.pending, (state) => {
        state.creating = true;
      })
      .addCase(createStory.rejected, (state) => {
        state.creating = false;
      })
      .addCase(createStory.fulfilled, (state, action) => {
        state.creating = false;
        const story: Story = action.payload;
        const group = state.groups.find((g) => g.user.id === story.user_id);
        if (group) {
          group.items.push(story);
          group.latest_at = story.created_at;
        } else {
          state.groups.unshift({
            user: story.user,
            has_unseen: false,
            latest_at: story.created_at,
            items: [story],
          });
        }
      })

      .addCase(markStoryViewed.fulfilled, (state, action) => {
        const found = locateStory(state, action.payload);
        if (found) {
          found.item.has_viewed = true;
          recomputeUnseen(found.group);
        }
      })

      .addCase(toggleStoryLike.fulfilled, (state, action) => {
        const found = locateStory(state, action.payload.storyId);
        if (found) {
          found.item.has_liked = action.payload.liked;
          found.item._count.likes += action.payload.liked ? 1 : -1;
        }
      })

      .addCase(setStoryReaction.fulfilled, (state, action) => {
        const found = locateStory(state, action.payload.storyId);
        if (found) {
          const had = found.item.my_reaction != null;
          const has = action.payload.emoji != null;
          found.item.my_reaction = action.payload.emoji;
          if (!had && has) found.item._count.reactions += 1;
          if (had && !has) found.item._count.reactions = Math.max(0, found.item._count.reactions - 1);
        }
      })

      .addCase(removeStory.fulfilled, (state, action) => {
        for (const group of state.groups) {
          const idx = group.items.findIndex((s) => s.id === action.payload);
          if (idx !== -1) {
            group.items.splice(idx, 1);
            recomputeUnseen(group);
            break;
          }
        }
        state.groups = state.groups.filter((g) => g.items.length > 0);
      });
  },
});

export const { locallyMarkViewed, applyRemoteStoryStat } = storiesSlice.actions;

export const selectStoryGroups = (state: RootState) => state.stories.groups;
export const selectStoryGroupByUser = (userId: string) => (state: RootState) =>
  state.stories.groups.find((g) => g.user.id === userId);

export default storiesSlice.reducer;
