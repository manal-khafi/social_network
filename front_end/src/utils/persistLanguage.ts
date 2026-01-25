
const KEY = "anm_language";

export function loadLanguage(): string | null {
  try {
    const serializedState = localStorage.getItem(KEY);
    return serializedState;
  } catch (err) {
    console.error("Error loading language from localStorage:", err);
    return null;
  }
}

export function saveLanguage(value: string): void {
  try {
    localStorage.setItem(KEY, value);
  } catch (err) {
    console.error("Error saving language to localStorage:", err);
  }
}
