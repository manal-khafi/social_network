import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  } | null;
  token: string | null;
}

const initialState: AuthState = {
  isAuthenticated: true, // Default to true for demo
  user: {
    id: '1',
    username: 'john_doe',
    email: 'john@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
  },
  token: 'demo-token',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ email: string; password: string }>) => {
      state.isAuthenticated = true;
      state.user = {
        id: '1',
        username: 'john_doe',
        email: action.payload.email,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      };
      state.token = 'demo-token';
    },
    register: (state, action: PayloadAction<{ username: string; email: string; password: string; isPublic: boolean }>) => {
      state.isAuthenticated = true;
      state.user = {
        id: Math.random().toString(36).substr(2, 9),
        username: action.payload.username,
        email: action.payload.email,
      };
      state.token = 'demo-token';
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    },
    resetPassword: (state, action: PayloadAction<{ email: string }>) => {
      // Password reset logic
    },
  },
});

export const { login, register, logout, resetPassword } = authSlice.actions;
export default authSlice.reducer;
