/** Max distinct @mentions acted on per text (notifications, story DMs). */
export const MAX_MENTIONS = 10;

// "@name" at the start or after a non-word character (so e-mail addresses and
// "@@x" are ignored). Usernames: letters, digits, "_" and "." (no trailing dot).
const MENTION_RE = /(?:^|[^\w@])@([A-Za-z0-9_.]{1,30})/g;

/** Distinct usernames mentioned in `text`, in order of appearance. */
export const parseMentions = (text: string | null | undefined): string[] => {
  if (!text) return [];
  const names = Array.from(text.matchAll(MENTION_RE), (m) => m[1].replace(/\.+$/, '')).filter(Boolean);
  return [...new Set(names)].slice(0, MAX_MENTIONS);
};
