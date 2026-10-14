import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import api from "../../api/axios";
import type { FirebaseUserSafe } from "../../utils/authUtils";

export interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
  avatar?: string;
  // Present when the session comes from /authentication/me or social login;
  // components fall back to this object until the full profile is loaded.
  avatar_url?: string | null;
  display_name?: string | null;
  bio?: string | null;
  followersCount?: number;
  followingCount?: number;
  isProfileComplete?: boolean;
  onboarding_done?: boolean;
}

const AUTH_STORAGE_KEY = "auth_session";

const loadPersistedAuth = (): { token: string | null; user: User | null } => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    const parsed = JSON.parse(raw) as { token?: string; user?: User };
    return {
      token: parsed.token ?? null,
      user: parsed.user ?? null,
    };
  } catch {
    return { token: null, user: null };
  }
};

const persistAuth = (token: string | null, user: User | null) => {
  try {
    if (!token) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ token, user: user ?? null })
    );
  } catch {
    // ignore persistence errors
  }
};

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  firebaseUser: FirebaseUserSafe | null;
  token: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const persisted = loadPersistedAuth();

const initialState: AuthState = {
  isAuthenticated: Boolean(persisted.token),
  user: persisted.user,
  firebaseUser: null,
  token: persisted.token,
  status: "idle",
  error: null,
};

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/authentication/me");
      return res.data; // { user }
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ?? "Unauthorized"
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { dispatch }) => {
    try {
      await api.post("/authentication/logout");
    } catch (error) {
      console.error("Logout API failed", error);
    } finally {
      dispatch(authSlice.actions.logout());
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{
        token: string | null;
        user?: User | null;
        firebaseUser?: FirebaseUserSafe | null;
      }>
    ) => {
      if ("firebaseUser" in action.payload) {
        state.firebaseUser = action.payload.firebaseUser ?? null;
      }
      if ("user" in action.payload) {
        state.user = action.payload.user ?? null;
      }
      state.token = action.payload.token ?? null;
      state.isAuthenticated = Boolean(state.token);
      persistAuth(state.token, state.user);
      state.status = "succeeded";
      state.error = null;
    },

    setFirebaseUser: (
      state,
      action: PayloadAction<FirebaseUserSafe | null>
    ) => {
      state.firebaseUser = action.payload;
    },

    setAuthLoading: (state) => {
      state.status = "loading";
      state.error = null;
    },

    setAuthError: (state, action: PayloadAction<string>) => {
      state.status = "failed";
      state.error = action.payload;
    },

    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.firebaseUser = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
      persistAuth(null, null);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMe.fulfilled, (state, action: any) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(fetchMe.rejected, (state, action: any) => {
        state.status = "failed";
        state.user = null;
        state.isAuthenticated = false;
        state.token = null;
        state.error = action.payload ?? "Unauthorized";
      });
  },
});

export const {
  setAuth,
  setAuthLoading,
  setAuthError,
  logout,
  setFirebaseUser,
} = authSlice.actions;

export default authSlice.reducer;
