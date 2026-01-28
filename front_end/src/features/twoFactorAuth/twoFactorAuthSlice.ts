import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';

interface TwoFactorAuthState {
  isEnabled: boolean;
  qrCodeDataUrl: string | null;
  manualKey: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: TwoFactorAuthState = {
  isEnabled: false,
  qrCodeDataUrl: null,
  manualKey: null,
  status: 'idle',
  error: null,
};

export const getTwoFactorAuthStatus = createAsyncThunk(
  'twoFactorAuth/getStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/2fa/status');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response.data);
    }
  }
);

export const setupTwoFactorAuth = createAsyncThunk(
  'twoFactorAuth/setup',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/2fa/setup');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response.data);
    }
  }
);

export const enableTwoFactorAuth = createAsyncThunk(
  'twoFactorAuth/enable',
  async (code: string, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/2fa/enable', { code });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response.data);
    }
  }
);

export const disableTwoFactorAuth = createAsyncThunk(
  'twoFactorAuth/disable',
  async (code: string, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/2fa/disable', { code });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response.data);
    }
  }
);

const twoFactorAuthSlice = createSlice({
  name: 'twoFactorAuth',
  initialState,
  reducers: {
    reset2FAState: (state) => {
      state.qrCodeDataUrl = null;
      state.manualKey = null;
      state.error = null;
      state.status = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTwoFactorAuthStatus.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getTwoFactorAuthStatus.fulfilled, (state, action: PayloadAction<{ twoFactorEnabled: boolean }>) => {
        state.status = 'succeeded';
        state.isEnabled = action.payload.twoFactorEnabled;
      })
      .addCase(getTwoFactorAuthStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(setupTwoFactorAuth.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(setupTwoFactorAuth.fulfilled, (state, action: PayloadAction<{ qrCodeDataUrl: string; manualKey: string }>) => {
        state.status = 'succeeded';
        state.qrCodeDataUrl = action.payload.qrCodeDataUrl;
        state.manualKey = action.payload.manualKey;
      })
      .addCase(setupTwoFactorAuth.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(enableTwoFactorAuth.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(enableTwoFactorAuth.fulfilled, (state, action: PayloadAction<{ twoFactorEnabled: boolean }>) => {
        state.status = 'succeeded';
        state.isEnabled = action.payload.twoFactorEnabled;
        state.qrCodeDataUrl = null;
        state.manualKey = null;
      })
      .addCase(enableTwoFactorAuth.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as any)?.message || 'Failed to enable 2FA';
      })
      .addCase(disableTwoFactorAuth.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(disableTwoFactorAuth.fulfilled, (state, action: PayloadAction<{ twoFactorEnabled: boolean }>) => {
        state.status = 'succeeded';
        state.isEnabled = action.payload.twoFactorEnabled;
      })
      .addCase(disableTwoFactorAuth.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as any)?.message || 'Failed to disable 2FA';
      });
  },
});

export const { reset2FAState } = twoFactorAuthSlice.actions;

export default twoFactorAuthSlice.reducer;
