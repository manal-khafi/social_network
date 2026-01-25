
export type LayoutDensity = "compact" | "comfortable" | "spacious";

const KEY = "anm_layout_density";

export function loadLayoutDensity(): LayoutDensity | null {
  try {
    const serializedState = localStorage.getItem(KEY);
    if (serializedState === null) {
      return null;
    }
    
    if (["compact", "comfortable", "spacious"].includes(serializedState)) {
      return serializedState as LayoutDensity;
    }

    return null;
  } catch (err) {
    console.error("Error loading layout density from localStorage:", err);
    return null;
  }
}

export function saveLayoutDensity(value: LayoutDensity): void {
  try {
    localStorage.setItem(KEY, value);
  } catch (err) {
    console.error("Error saving layout density to localStorage:", err);
  }
}
