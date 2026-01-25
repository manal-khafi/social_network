import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from '../../store';
import { loadTextSize } from '../../utils/persistTextSize';

interface TextSizeState {
  fontSize: number;
}

const MIN_SIZE = 14;
const MAX_SIZE = 20;
const DEFAULT_SIZE = 16;

const initialState: TextSizeState = {
  fontSize: loadTextSize() ?? DEFAULT_SIZE,
};

const textSizeSlice = createSlice({
  name: 'textSize',
  initialState,
  reducers: {
    setFontSize: (state, action: PayloadAction<number>) => {
      let newSize = action.payload;
      // Clamp the value to be within the allowed range
      if (newSize < MIN_SIZE) {
        newSize = MIN_SIZE;
      } else if (newSize > MAX_SIZE) {
        newSize = MAX_SIZE;
      }
      state.fontSize = newSize;
    },
  },
});

export const { setFontSize } = textSizeSlice.actions;

export const selectFontSize = (state: RootState) => state.textSize.fontSize;

export default textSizeSlice.reducer;