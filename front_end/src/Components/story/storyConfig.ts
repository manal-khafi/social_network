// Shared constants for the story composer + viewer.

export const STORY_ASPECT = 9 / 16;

// Per-segment display time. Videos use their own duration (capped).
export const IMAGE_STORY_MS = 5000;
export const MAX_VIDEO_STORY_MS = 60000;

export const TEXT_COLORS = [
  "#ffffff",
  "#000000",
  "#ff3b30",
  "#ff9500",
  "#ffcc00",
  "#34c759",
  "#00c7be",
  "#0a84ff",
  "#5856d6",
  "#ff2d95",
];

export const STORY_BACKGROUNDS = [
  "linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",
  "linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)",
  "linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)",
  "linear-gradient(135deg,#fa709a 0%,#fee140 100%)",
  "linear-gradient(135deg,#30cfd0 0%,#330867 100%)",
  "linear-gradient(135deg,#a8edea 0%,#fed6e3 100%)",
  "#111827",
  "#7c3aed",
];

export const FONT_FAMILIES = [
  { label: "Classic", value: "'Inter', system-ui, sans-serif" },
  { label: "Typewriter", value: "'Courier New', monospace" },
  { label: "Serif", value: "'Georgia', serif" },
  { label: "Strong", value: "'Arial Black', 'Inter', sans-serif" },
];

export const VISIBILITY_OPTIONS: {
  value: "public" | "friends" | "close_friends";
  label: string;
  hint: string;
}[] = [
  { value: "public", label: "Everyone", hint: "Anyone can see this story" },
  { value: "friends", label: "Friends", hint: "Only people you follow back" },
  { value: "close_friends", label: "Close friends", hint: "Only your close friends list" },
];
