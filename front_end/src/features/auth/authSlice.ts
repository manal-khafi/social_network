import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  } | null;
  token: string | null;
  loading: boolean;
}

// Restore initial state from localStorage
const getInitialState = (): AuthState => {
  const token =
    localStorage.getItem("authToken") || localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      return {
        isAuthenticated: true,
        user: {
          id: user.id || "",
          username: user.username || "",
          email: user.email || "",
          avatar: user.avatar_url || user.avatar,
        },
        token,
        loading: false,
      };
    } catch {
      // Invalid user data, clear it
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      localStorage.removeItem("token");
    }
  }

  return {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
  };
};

const initialState: AuthState = getInitialState();

// Async thunk to verify token and get user
export const verifyAuth = createAsyncThunk(
  "auth/verifyAuth",
  async (_, { rejectWithValue }) => {
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("token");
    if (!token) {
      return rejectWithValue("No token");
    }

    try {
      // Call backend to verify token and get user
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3500/api";
      const response = await fetch(`${apiUrl}/authentification/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Token invalid");
      }

      const user = await response.json();
      return { user, token };
    } catch {
      // Token invalid, clear storage
      localStorage.removeItem("authToken");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return rejectWithValue("Token invalid");
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
        user: {
          id: string;
          username?: string;
          display_name?: string;
          email: string;
          avatar_url?: string;
          avatar?: string;
          [key: string]: unknown;
        };
        token: string;
      }>
    ) => {
      state.isAuthenticated = true;
      state.user = {
        id: action.payload.user.id,
        username:
          action.payload.user.username ||
          action.payload.user.display_name ||
          "",
        email: action.payload.user.email,
        avatar: action.payload.user.avatar_url || action.payload.user.avatar,
      };
      state.token = action.payload.token;

      // Save to localStorage
      localStorage.setItem("authToken", action.payload.token);
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;

      // Clear localStorage
      localStorage.removeItem("authToken");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    // Keep old actions for backward compatibility (no-op)
    login: () => {
      // This is now handled by setAuth
      // Keeping for backward compatibility
    },
    register: () => {
      // This is now handled by setAuth
      // Keeping for backward compatibility
    },
    resetPassword: () => {
      // Password reset logic
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(verifyAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = {
          id: action.payload.user.id,
          username:
            action.payload.user.username ||
            action.payload.user.display_name ||
            "",
          email: action.payload.user.email,
          avatar: action.payload.user.avatar_url || action.payload.user.avatar,
        };
        state.token = action.payload.token;

        // Update localStorage
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(verifyAuth.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });
  },
});

export const { setAuth, logout, login, register, resetPassword } =
  authSlice.actions;
export default authSlice.reducer;
