export type AccessibilityPersistedState = {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  largerTouchTargets: boolean;
};

const KEY = "anm_accessibility";

export function loadAccessibility(): Partial<AccessibilityPersistedState> | null {
  try {
    const serializedState = localStorage.getItem(KEY);
    if (serializedState === null) {
      return null;
    }
    const parsed = JSON.parse(serializedState);
    const result: Partial<AccessibilityPersistedState> = {};

    if (typeof parsed.highContrast === "boolean") {
      result.highContrast = parsed.highContrast;
    }
    if (typeof parsed.reducedMotion === "boolean") {
      result.reducedMotion = parsed.reducedMotion;
    }
    if (typeof parsed.screenReader === "boolean") {
      result.screenReader = parsed.screenReader;
    }
    if (typeof parsed.largerTouchTargets === "boolean") {
      result.largerTouchTargets = parsed.largerTouchTargets;
    }

    return result;
  } catch (err) {
    console.error("Error loading accessibility state from localStorage:", err);
    return null;
  }
}

export function saveAccessibility(state: AccessibilityPersistedState): void {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(KEY, serializedState);
  } catch (err) {
    console.error("Error saving accessibility state to localStorage:", err);
  }
}
