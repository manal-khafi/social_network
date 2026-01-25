const TEXT_SIZE_KEY = 'app-text-size';
const MIN_SIZE = 14;
const MAX_SIZE = 20;

/**
 * Loads the text size from localStorage.
 * @returns {number | null} The stored text size or null if not set or invalid.
 */
export const loadTextSize = (): number | null => {
  try {
    const storedSize = localStorage.getItem(TEXT_SIZE_KEY);
    if (storedSize) {
      const size = parseInt(storedSize, 10);
      if (!isNaN(size) && size >= MIN_SIZE && size <= MAX_SIZE) {
        return size;
      }
    }
  } catch (error) {
    console.error("Failed to load text size from localStorage", error);
  }
  return null;
};

/**
 * Saves the text size to localStorage.
 * @param {number} size The text size to save.
 */
export const saveTextSize = (size: number): void => {
  try {
    if (size >= MIN_SIZE && size <= MAX_SIZE) {
      localStorage.setItem(TEXT_SIZE_KEY, String(size));
    }
  } catch (error) {
    console.error("Failed to save text size to localStorage", error);
  }
};