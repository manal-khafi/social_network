import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { loadAccessibility} from "../../utils/persistAccessibility";
import type { AccessibilityPersistedState } from "../../utils/persistAccessibility";


type AccessibilityState = AccessibilityPersistedState;

const initialState: AccessibilityState = {
  highContrast: false,
  reducedMotion: false,
  screenReader: false,
  largerTouchTargets: false,
  ...loadAccessibility(),
};

const accessibilitySlice = createSlice({
  name: "accessibility",
  initialState,
  reducers: {
    setHighContrast(state, action: PayloadAction<boolean>) {
      state.highContrast = action.payload;
    },
    setReducedMotion(state, action: PayloadAction<boolean>) {
      state.reducedMotion = action.payload;
    },
    setScreenReader(state, action: PayloadAction<boolean>) {
      state.screenReader = action.payload;
    },
    setLargerTouchTargets(state, action: PayloadAction<boolean>) {
      state.largerTouchTargets = action.payload;
    },
  },
});

export const {
  setHighContrast,
  setReducedMotion,
  setScreenReader,
  setLargerTouchTargets,
} = accessibilitySlice.actions;

export default accessibilitySlice.reducer;
