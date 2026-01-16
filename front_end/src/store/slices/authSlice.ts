import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { forgotPassword as forgotPasswordAPI } from "../../util/authService";

interface AuthState {
  loading: boolean;
  success: boolean;
  message: string | null;
  error: string | null;
}

const initialState: AuthState = {
  loading: false,
  success: false,
  message: null,
  error: null,
};
export const forgotPassword = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("auth/forgotPassword", async (email, { rejectWithValue }) => {
  try {
    return await forgotPasswordAPI(email);
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "response" in err &&
      (err as { response?: { data?: { error?: string } } }).response?.data
        ?.error
    ) {
      return rejectWithValue(
        (err as { response?: { data?: { error?: string } } }).response!.data!
          .error!
      );
    }
    return rejectWithValue("Failed to send reset email");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unknown error";
      });
  },
});

export const { resetAuthState } = authSlice.actions;
export default authSlice.reducer;
