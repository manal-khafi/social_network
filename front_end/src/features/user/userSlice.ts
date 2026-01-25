import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import api from "../../api/axios";
import type { RootState } from "../../store";

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;

  // optional frontend-only fields
  coverImage?: string;
  isPublic?: boolean;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  followRequestPending?: boolean;
  isBlocked?: boolean;
}

interface UserState {
  currentUser: UserProfile | null;
  viewedUser: UserProfile | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;

  followers: UserProfile[];
  following: UserProfile[];
  blockedUsers: UserProfile[];
  suggestedUsers: UserProfile[];
  followRequests: UserProfile[];
  blockedCount: number;
}

const initialState: UserState = {
  currentUser: null,
  viewedUser: null,
  status: "idle",
  error: null,

  followers: [],
  following: [],
  blockedUsers: [],
  suggestedUsers: [],
  followRequests: [],
  blockedCount: 0,
};

// -------------------------
// PROFILE
// -------------------------
export const fetchCurrentUserProfile = createAsyncThunk<
  UserProfile,
  void,
  { state: RootState; rejectValue: string }
>("user/fetchCurrentUserProfile", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get(`/profile/me`);
    return response.data.user as UserProfile;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch profile");
  }
});

// -------------------------
// FOLLOW SYSTEM (your routes)
// -------------------------
export const followUser = createAsyncThunk<
  { userId: string },
  string,
  { rejectValue: string }
>("user/followUser", async (userIdToFollow, { rejectWithValue }) => {
  try {
    await api.post(`/follow/follow/${userIdToFollow}`);
    return { userId: userIdToFollow };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to follow user");
  }
});

export const unfollowUser = createAsyncThunk<
  { userId: string },
  string,
  { rejectValue: string }
>("user/unfollowUser", async (userIdToUnfollow, { rejectWithValue }) => {
  try {
    await api.delete(`/follow/unfollow/${userIdToUnfollow}`);
    return { userId: userIdToUnfollow };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to unfollow user");
  }
});

/**
 * Your UI imports toggleFollow.
 * We'll implement it using the current viewedUser.isFollowing state.
 */
export const toggleFollow = createAsyncThunk<
  { userId: string; isFollowing: boolean },
  string,
  { state: RootState; rejectValue: string }
>("user/toggleFollow", async (userId, { getState, dispatch, rejectWithValue }) => {
  try {
    const currentlyFollowing = !!getState().user.viewedUser?.isFollowing;

    if (currentlyFollowing) {
      await dispatch(unfollowUser(userId)).unwrap();
      return { userId, isFollowing: false };
    } else {
      await dispatch(followUser(userId)).unwrap();
      return { userId, isFollowing: true };
    }
  } catch (error: any) {
    return rejectWithValue(error?.message || "Failed to toggle follow");
  }
});

export const acceptFollowRequest = createAsyncThunk<
  { demandeId: string },
  string,
  { rejectValue: string }
>("user/acceptFollowRequest", async (demandeId, { rejectWithValue }) => {
  try {
    await api.post(`/follow/accept-follow/${demandeId}`);
    return { demandeId };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to accept follow request");
  }
});

export const denyFollowRequest = createAsyncThunk<
  { requestId: string },
  string,
  { rejectValue: string }
>("user/denyFollowRequest", async (requestId, { rejectWithValue }) => {
  try {
    await api.post(`/follow/refuse-follow/${requestId}`);
    return { requestId };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to deny follow request");
  }
});

export const fetchFollowers = createAsyncThunk<
  UserProfile[],
  string,
  { rejectValue: string }
>("user/fetchFollowers", async (userId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/follow/followers/${userId}`);
    return res.data as UserProfile[];
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch followers");
  }
});

export const fetchFollowing = createAsyncThunk<
  UserProfile[],
  string,
  { rejectValue: string }
>("user/fetchFollowing", async (userId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/follow/following/${userId}`);
    return res.data as UserProfile[];
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch following");
  }
});

// -------------------------
// BLOCK SYSTEM (your real controller routes)
// -------------------------
export const blockUser = createAsyncThunk<
  { blockedUserId: string },
  string,
  { rejectValue: string }
>("user/blockUser", async (blockedUserId, { rejectWithValue }) => {
  try {
    await api.post(`/blocks`, { blockedUserId });
    return { blockedUserId };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to block user");
  }
});

export const unblockUser = createAsyncThunk<
  { blockedUserId: string },
  string,
  { rejectValue: string }
>("user/unblockUser", async (blockedUserId, { rejectWithValue }) => {
  try {
    // axios delete with body => use { data: ... }
    await api.delete(`/blocks`, { data: { blockedUserId } });
    return { blockedUserId };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to unblock user");
  }
});

export const checkBlock = createAsyncThunk<
  { targetUserId: string; isBlocked: boolean },
  string,
  { rejectValue: string }
>("user/checkBlock", async (targetUserId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/blocks/check/${targetUserId}`);
    return { targetUserId, isBlocked: !!res.data?.isBlocked };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to check block");
  }
});

export const fetchBlockedCount = createAsyncThunk<
  number,
  void,
  { rejectValue: string }
>("user/fetchBlockedCount", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get(`/blocks/count`);
    const count = Number(res.data?.data?.count ?? 0);
    return Number.isFinite(count) ? count : 0;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch blocked count");
  }
});

export const fetchBlockedUsers = createAsyncThunk<
  UserProfile[],
  { page?: number; limit?: number } | void,
  { rejectValue: string }
>("user/fetchBlockedUsers", async (params, { rejectWithValue }) => {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;

    const res = await api.get(`/blocks`, { params: { page, limit } });
    // controller returns: { success, data: blockedUsers, pagination }
    return (res.data?.data ?? []) as UserProfile[];
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch blocked users");
  }
});

// -------------------------
// PRIVACY (route not provided yet)
// -------------------------
export const togglePrivacy = createAsyncThunk<
  { isPublic: boolean },
  void,
  { rejectValue: string }
>("user/togglePrivacy", async (_, { rejectWithValue }) => {
  try {
    /**
     * TODO: Replace with your real endpoint.
     * If you paste the privacy router/controller, I’ll set it exactly.
     */
    const res = await api.post(`/profile/toggle-privacy`);
    return { isPublic: !!res.data?.isPublic };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to toggle privacy");
  }
});

// -------------------------
// SLICE
// -------------------------
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setViewedUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.viewedUser = action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.currentUser) state.currentUser = { ...state.currentUser, ...action.payload };
    },
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // profile
      .addCase(fetchCurrentUserProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCurrentUserProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.currentUser = action.payload;
      })
      .addCase(fetchCurrentUserProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Failed to fetch profile";
      })

      // follow
      .addCase(followUser.fulfilled, (state, action) => {
        if (state.viewedUser?.id === action.payload.userId) state.viewedUser.isFollowing = true;
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        if (state.viewedUser?.id === action.payload.userId) state.viewedUser.isFollowing = false;
      })
      .addCase(toggleFollow.fulfilled, (state, action) => {
        const { userId, isFollowing } = action.payload;
        if (state.viewedUser?.id === userId) state.viewedUser.isFollowing = isFollowing;
      })

      // followers/following list
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        state.followers = action.payload;
      })
      .addCase(fetchFollowing.fulfilled, (state, action) => {
        state.following = action.payload;
      })

      // follow requests (best effort removal)
      .addCase(acceptFollowRequest.fulfilled, (state, action) => {
        state.followRequests = state.followRequests.filter(
          (u) => u.id !== action.payload.demandeId
        );
      })
      .addCase(denyFollowRequest.fulfilled, (state, action) => {
        state.followRequests = state.followRequests.filter(
          (u) => u.id !== action.payload.requestId
        );
      })

      // block
      .addCase(blockUser.fulfilled, (state, action) => {
        const targetId = action.payload.blockedUserId;
        if (state.viewedUser?.id === targetId) state.viewedUser.isBlocked = true;
      })
      .addCase(unblockUser.fulfilled, (state, action) => {
        const targetId = action.payload.blockedUserId;
        if (state.viewedUser?.id === targetId) state.viewedUser.isBlocked = false;
      })
      .addCase(checkBlock.fulfilled, (state, action) => {
        if (state.viewedUser?.id === action.payload.targetUserId) {
          state.viewedUser.isBlocked = action.payload.isBlocked;
        }
      })
      .addCase(fetchBlockedCount.fulfilled, (state, action) => {
        state.blockedCount = action.payload;
      })
      .addCase(fetchBlockedUsers.fulfilled, (state, action) => {
        state.blockedUsers = action.payload;
      })

      // privacy
      .addCase(togglePrivacy.fulfilled, (state, action) => {
        if (state.currentUser) state.currentUser.isPublic = action.payload.isPublic;
      })

      // generic error capture
      .addMatcher(
        (action) => action.type.startsWith("user/") && action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.error = action.payload || action.error?.message || "Request failed";
        }
      );
  },
});

export const { setViewedUser, updateProfile, clearUserError } = userSlice.actions;
export default userSlice.reducer;

// Optional selectors
export const selectCurrentUser = (state: RootState) => state.user.currentUser;
export const selectViewedUser = (state: RootState) => state.user.viewedUser;
export const selectBlockedUsers = (state: RootState) => state.user.blockedUsers;
export const selectBlockedCount = (state: RootState) => state.user.blockedCount;
export const selectUserStatus = (state: RootState) => state.user.status;
export const selectUserError = (state: RootState) => state.user.error;
