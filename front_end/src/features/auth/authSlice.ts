import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import api from "../../api/axios";
import type { FirebaseUserSafe } from "../../utils/authUtils";
import { firebaseSignOut } from "../../config/firebaseConfig";

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
  /** True while logoutUser is running: disables the logout buttons. */
  isLoggingOut: boolean;
}

const persisted = loadPersistedAuth();

const initialState: AuthState = {
  isAuthenticated: Boolean(persisted.token),
  user: persisted.user,
  firebaseUser: null,
  token: persisted.token,
  status: "idle",
  error: null,
  isLoggingOut: false,
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

// Don't keep the user waiting on a slow or sleeping server to sign out.
const LOGOUT_TIMEOUT_MS = 8000;

/**
 * Full sign-out. The server is asked to revoke the session (token_version bump,
 * refresh cookie cleared) and the local session is cleared whatever the answer,
 * so a failed or slow request never leaves the user signed in on this device.
 */
export const logoutUser = createAsyncThunk<void, void, { state: { auth: AuthState } }>(
  "auth/logoutUser",
  async (_, { dispatch }) => {
    try {
      await api.post("/authentication/logout", null, { timeout: LOGOUT_TIMEOUT_MS });
    } catch (error) {
      console.error("Logout API failed", error);
    } finally {
      // Google / Facebook users also hold a Firebase session in this browser.
      await firebaseSignOut().catch(() => undefined);
      // Onboarding draft of the account that is leaving.
      try {
        localStorage.removeItem("setupWizardData");
      } catch {
        // ignore storage errors
      }
      dispatch(authSlice.actions.logout());
    }
  },
  // A second click while a logout is in flight does nothing.
  { condition: (_, { getState }) => !getState().auth.isLoggingOut }
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
      state.isLoggingOut = false;
      persistAuth(null, null);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoggingOut = true;
      })
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
      })
      // New avatar saved (userSlice.updateMyAvatar; matched by type to avoid an
      // import cycle): keep the session user, and its persisted copy, in step.
      .addMatcher(
        (action): action is PayloadAction<{ avatar_url?: string | null }> =>
          action.type === "user/updateMyAvatar/fulfilled",
        (state, action) => {
          if (!state.user) return;
          state.user.avatar_url = action.payload.avatar_url ?? null;
          persistAuth(state.token, state.user);
        }
      );
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
