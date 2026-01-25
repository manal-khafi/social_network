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
  isProfileComplete?: boolean;
  onboarding_done?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;                 
  firebaseUser: FirebaseUserSafe | null; 
  token: string | null;              
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  firebaseUser: null,
  token: null,
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
        firebaseUser: FirebaseUserSafe | null;
        token: string;
      }>
    ) => {
      state.firebaseUser = action.payload.firebaseUser;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.status = "succeeded";
      state.error = null;
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
} = authSlice.actions;

export default authSlice.reducer;
