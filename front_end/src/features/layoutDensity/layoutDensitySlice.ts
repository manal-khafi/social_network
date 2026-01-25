import { createSlice} from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { loadLayoutDensity } from "../../utils/persistLayoutDensity";
import type { LayoutDensity } from "../../utils/persistLayoutDensity";

interface LayoutDensityState {
  density: LayoutDensity;
}

const initialState: LayoutDensityState = {
  density: loadLayoutDensity() || "comfortable",
};

const layoutDensitySlice = createSlice({
  name: "layoutDensity",
  initialState,
  reducers: {
    setLayoutDensity(state, action: PayloadAction<LayoutDensity>) {
      state.density = action.payload;
    },
  },
});

export const { setLayoutDensity } = layoutDensitySlice.actions;

export default layoutDensitySlice.reducer;
