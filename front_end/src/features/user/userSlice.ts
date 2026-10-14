import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import api from "../../api/axios";
import type { RootState, AppDispatch } from "../../store";
import { removePostsByUserId } from "../posts/postsSlice";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;

  adresse?: string | null;
  date_of_birth?: string | null;

  is_private?: boolean;
  allow_comments?: boolean;
  allow_mentions?: boolean;
  show_activity_status?: boolean;
  allow_read_receipts?: boolean;

  cover_image?: string | null;
  /** Own profile only: false for Google accounts. */
  has_password?: boolean;
  isBlocked?: boolean;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  followRequestPending?: boolean;
  canViewPosts?: boolean;
}

export interface FollowRequest {
  requestId: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    bio?: string | null;
  };
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
  followRequests: FollowRequest[];
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

const getErrorMessage = (error: unknown, fallback: string) => {
  const e = error as {
    response?: { data?: { message?: string; error?: string; msg?: string } };
    message?: string;
  };
  const msg =
    e.response?.data?.message ||
    e.response?.data?.error ||
    e.response?.data?.msg ||
    e.message;

  return typeof msg === "string" && msg.trim() ? msg : fallback;
};

// -------------------------
// PROFILE
// -------------------------
export const fetchCurrentUserProfile = createAsyncThunk<
  UserProfile,
  void,
  { rejectValue: string }
>("user/fetchCurrentUserProfile", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/profile/me");
    return res.data.user as UserProfile;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to fetch profile"));
  }
});

export const fetchUserProfile = createAsyncThunk<
  UserProfile,
  string,
  { rejectValue: string }
>("user/fetchUserProfile", async (username, { rejectWithValue }) => {
  try {
    const res = await api.get(`/profile/${encodeURIComponent(username)}`);
    return res.data as UserProfile;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to fetch user profile"));
  }
});

export const saveMyProfile = createAsyncThunk<
  UserProfile,
  {
    username: string;
    display_name: string;
    bio: string | null;
    adresse: string | null;
    date_of_birth: string | null;
    is_private: boolean;
    allow_comments: boolean;
    allow_mentions: boolean;
    show_activity_status: boolean;
  },
  { rejectValue: string }
>("user/saveMyProfile", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.put("/profile/me", payload);
    return res.data.user as UserProfile;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to update profile"));
  }
});

export const updateMyAvatar = createAsyncThunk<
  UserProfile,
  { avatar_url: string },
  { rejectValue: string }
>("user/updateMyAvatar", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.put("/profile/me/avatar", payload);
    return res.data.user as UserProfile;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to update avatar"));
  }
});

export const updateCoverImage = createAsyncThunk<
  { cover_image: string },
  { cover_image: string },
  { rejectValue: string }
>("user/updateCoverImage", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.put("/profile/me/cover", payload);
    const cover = res.data?.user?.cover_image;
    if (!cover) return rejectWithValue("Server did not return cover_image");
    return { cover_image: cover as string };
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to update cover image"));
  }
});

// If you want privacy toggle to really hit backend:
export const togglePrivacy = createAsyncThunk<
  { isPublic: boolean },
  void,
  { state: RootState; rejectValue: string }
>("user/togglePrivacy", async (_, { getState, rejectWithValue }) => {
  try {
    const currentUser = getState().user.currentUser;
    if (!currentUser) return rejectWithValue("No current user loaded");

    const newIsPublic = !(currentUser.is_private ?? false);

    await api.put("/profile/me", {
      username: currentUser.username,
      display_name: currentUser.display_name,
      bio: currentUser.bio,
      adresse: currentUser.adresse ?? null,
      date_of_birth: currentUser.date_of_birth ?? null,
      is_private: !newIsPublic,
    });

    return { isPublic: newIsPublic };
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to toggle privacy"));
  }
});

// ✅ IMPORTANT: define this BEFORE createSlice (const is not hoisted)
export const updatePrivacySettings = createAsyncThunk<
  Pick<
    UserProfile,
    "is_private" | "allow_comments" | "allow_mentions" | "show_activity_status" | "allow_read_receipts"
  >,
  Partial<
    Pick<
      UserProfile,
      "is_private" | "allow_comments" | "allow_mentions" | "show_activity_status" | "allow_read_receipts"
    >
  >,
  { rejectValue: string }
>("user/updatePrivacySettings", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.patch("/privacy/me/privacy", payload);
    return res.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to update privacy"));
  }
});

// -------------------------
// FOLLOW SYSTEM
// -------------------------
export const followUser = createAsyncThunk<
  { userId: string; status: "accepted" | "pending" },
  string,
  { rejectValue: string }
>("user/followUser", async (userIdToFollow, { rejectWithValue }) => {
  try {
    const res = await api.post(`/follow/follow/${userIdToFollow}`);
    const statusRaw = String(res.data?.status || "").toLowerCase();
    const status = statusRaw === "accepted" ? "accepted" : "pending";
    return { userId: userIdToFollow, status };
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to follow user"));
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
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to unfollow user"));
  }
});

export const toggleFollow = createAsyncThunk<
  { userId: string; isFollowing: boolean; followRequestPending: boolean },
  string,
  { state: RootState; rejectValue: string }
>("user/toggleFollow", async (targetUserId, { getState, dispatch, rejectWithValue }) => {
  try {
    const state = getState();

    const myId = state.user.currentUser?.id ?? state.auth.user?.id;

    if (myId && targetUserId === myId) {
      toast.error("You can't follow yourself");
      return rejectWithValue("You can't follow yourself");
    }

    // ✅ Get relationship state from wherever we might have the user
    const rel =
      state.user.following.find((u) => u.id === targetUserId) ??
      state.user.followers.find((u) => u.id === targetUserId) ??
      state.user.suggestedUsers.find((u) => u.id === targetUserId) ??
      (state.user.viewedUser?.id === targetUserId ? state.user.viewedUser : undefined);

    const isFollowing = !!rel?.isFollowing;
    const isPending = !!rel?.followRequestPending && !isFollowing;
    const isPrivate = !!rel?.is_private;

    if (isPending) return rejectWithValue("Follow request is already pending");

    if (isFollowing) {
      await dispatch(unfollowUser(targetUserId)).unwrap();
      if (isPrivate) {
        dispatch(removePostsByUserId(targetUserId));
      }
      return { userId: targetUserId, isFollowing: false, followRequestPending: false };
    }

    const result = await dispatch(followUser(targetUserId)).unwrap();
    const accepted = result.status === "accepted";
    return { userId: targetUserId, isFollowing: accepted, followRequestPending: !accepted };
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to toggle follow"));
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
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to accept follow request"));
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
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to deny follow request"));
  }
});

export const fetchFollowers = createAsyncThunk<
  UserProfile[],
  string,
  { rejectValue: string }
>("user/fetchFollowers", async (userId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/follow/followers/${userId}`);
    return (res.data?.users ?? []) as UserProfile[];
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to fetch followers"));
  }
});

export const fetchFollowRequests = createAsyncThunk<
  FollowRequest[],
  void,
  { rejectValue: string }
>("user/fetchFollowRequests", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/follow/requests");
    return (res.data?.requests ?? []) as FollowRequest[];
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to fetch follow requests"));
  }
});

export const fetchFollowing = createAsyncThunk<
  UserProfile[],
  string,
  { rejectValue: string }
>("user/fetchFollowing", async (userId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/follow/following/${userId}`);
    return (res.data?.users ?? []) as UserProfile[];
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to fetch following"));
  }
});

// -------------------------
// BLOCK SYSTEM
// -------------------------
export const blockUser = createAsyncThunk<
  { blockedUserId: string },
  string,
  { dispatch: AppDispatch; rejectValue: string }
>("user/blockUser", async (blockedUserId, thunkAPI) => {
  try {
    await api.post(`/blocks`, { blockedUserId });

    thunkAPI.dispatch(removePostsByUserId(blockedUserId));
    thunkAPI.dispatch(fetchBlockedUsers());
    thunkAPI.dispatch(fetchBlockedCount());

    return { blockedUserId };
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, "Failed to block user"));
  }
});

export const unblockUser = createAsyncThunk<
  { blockedUserId: string },
  string,
  { rejectValue: string }
>("user/unblockUser", async (blockedUserId, { rejectWithValue }) => {
  try {
    await api.delete(`/blocks`, { data: { blockedUserId } });
    return { blockedUserId };
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to unblock user"));
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
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to check block"));
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
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to fetch blocked count"));
  }
});

export const fetchBlockedUsers = createAsyncThunk<
  UserProfile[],
  { page?: number; limit?: number } | void,
  { rejectValue: string }
>("user/fetchBlockedUsers", async (params, { rejectWithValue }) => {
  try {
    const page = (params ? params.page : undefined) ?? 1;
    const limit = (params ? params.limit : undefined) ?? 20;

    const res = await api.get(`/blocks`, { params: { page, limit } });
    return (res.data?.data ?? []) as UserProfile[];
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, "Failed to fetch blocked users"));
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

    updateProfileLocal: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },

    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // profile fetch
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
      .addCase(fetchUserProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.viewedUser = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Failed to fetch user profile";
      })

      // save profile (backend)
      .addCase(saveMyProfile.fulfilled, (state, action) => {
        state.currentUser = action.payload;
      })

      // avatar (backend)
      .addCase(updateMyAvatar.fulfilled, (state, action) => {
        // The endpoint returns only part of the profile: keep the rest (counts...).
        state.currentUser = state.currentUser
          ? { ...state.currentUser, ...action.payload }
          : action.payload;
      })

      // cover image (backend)
      .addCase(updateCoverImage.fulfilled, (state, action) => {
        const newCover = action.payload.cover_image;

        if (state.currentUser) state.currentUser.cover_image = newCover;
        if (state.viewedUser && state.currentUser && state.viewedUser.id === state.currentUser.id) {
          state.viewedUser.cover_image = newCover;
        }
      })

      // privacy
      .addCase(togglePrivacy.fulfilled, (state, action) => {
        if (state.currentUser) {
          state.currentUser.is_private = !action.payload.isPublic;
        }
      })

      // follow
      .addCase(followUser.fulfilled, (state, action) => {
        const accepted = action.payload.status === "accepted";

        // current user counts
        if (accepted && state.currentUser) {
          state.currentUser.followingCount = (state.currentUser.followingCount ?? 0) + 1;
        }

        // viewed user
        if (state.viewedUser?.id === action.payload.userId) {
          state.viewedUser.isFollowing = accepted;
          state.viewedUser.followRequestPending = !accepted;
          if (accepted) {
            state.viewedUser.followersCount = (state.viewedUser.followersCount ?? 0) + 1;
          }
        }
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        if (state.currentUser) {
          state.currentUser.followingCount = Math.max(
            0,
            (state.currentUser.followingCount ?? 0) - 1
          );
        }

        if (state.viewedUser?.id === action.payload.userId) {
          state.viewedUser.isFollowing = false;
          state.viewedUser.followRequestPending = false;
          state.viewedUser.followersCount = Math.max(
            0,
            (state.viewedUser.followersCount ?? 0) - 1
          );
        }
      })

      // ✅ MAIN FIX: update lists too
      .addCase(toggleFollow.fulfilled, (state, action) => {
        const { userId, isFollowing, followRequestPending } = action.payload;

        if (state.viewedUser?.id === userId) {
          state.viewedUser.isFollowing = isFollowing;
          state.viewedUser.followRequestPending = followRequestPending;
        }

        const inFollowers = state.followers.find((u) => u.id === userId);
        if (inFollowers) {
          inFollowers.isFollowing = isFollowing;
          inFollowers.followRequestPending = followRequestPending;
        }

        const inFollowing = state.following.find((u) => u.id === userId);
        if (inFollowing) {
          inFollowing.isFollowing = isFollowing;
          inFollowing.followRequestPending = followRequestPending;
        }

        // optional: if you unfollow from following list, remove it
        if (!isFollowing) {
          state.following = state.following.filter((u) => u.id !== userId);
        }
      })

      // followers/following list
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        state.followers = action.payload.map((u) => ({
          ...u,
          isFollowing: u.isFollowing ?? false,
          followRequestPending: u.followRequestPending ?? false,
        }));
      })
      .addCase(fetchFollowing.fulfilled, (state, action) => {
        // ✅ Following page must show "Unfollow" by default
        state.following = action.payload.map((u) => ({
          ...u,
          isFollowing: true,
          followRequestPending: false,
        }));
      })

      // follow requests
  .addCase(fetchFollowRequests.fulfilled, (state, action) => {
    state.followRequests = action.payload;
  })
      .addCase(acceptFollowRequest.fulfilled, (state, action) => {
    state.followRequests = state.followRequests.filter(
      (req) => req.requestId !== action.payload.demandeId
    );
      })
      .addCase(denyFollowRequest.fulfilled, (state, action) => {
    state.followRequests = state.followRequests.filter(
      (req) => req.requestId !== action.payload.requestId
    );
      })

      // block
      .addCase(blockUser.fulfilled, (state, action) => {
        const targetId = action.payload.blockedUserId;
        const blockedUserProfile =
          state.suggestedUsers.find((u) => u.id === targetId) || state.viewedUser;

        if (blockedUserProfile && !state.blockedUsers.some((u) => u.id === targetId)) {
          state.blockedUsers.push({ ...blockedUserProfile, isBlocked: true });
        }

        if (state.viewedUser?.id === targetId) {
          state.viewedUser.isBlocked = true;
        }
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

      .addCase(updatePrivacySettings.fulfilled, (state, action) => {
        if (!state.currentUser) return;
        state.currentUser = { ...state.currentUser, ...action.payload };
      })

      // generic error capture
      .addMatcher(
        (action) => action.type.startsWith("user/") && action.type.endsWith("/rejected"),
        (state, action: { payload?: string; error?: { message?: string } }) => {
          state.error = action.payload || action.error?.message || "Request failed";
        }
      );
  },
});

export const { setViewedUser, updateProfileLocal, clearUserError } = userSlice.actions;
export default userSlice.reducer;

// selectors
export const selectCurrentUser = (state: RootState) => state.user.currentUser;
/** The signed-in user's avatar: one source for every place that shows it. */
export const selectMyAvatar = (state: RootState): string | undefined =>
  state.user.currentUser?.avatar_url ??
  state.auth.user?.avatar_url ??
  state.auth.user?.avatar ??
  undefined;
export const selectViewedUser = (state: RootState) => state.user.viewedUser;
export const selectBlockedUsers = (state: RootState) => state.user.blockedUsers;
export const selectBlockedCount = (state: RootState) => state.user.blockedCount;
export const selectUserStatus = (state: RootState) => state.user.status;
export const selectUserError = (state: RootState) => state.user.error;
