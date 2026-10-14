import type { ReactNode } from "react";
import { Link } from "react-router-dom";

// Same rule as the backend (back_end/src/util/mentions.ts): "@name" at the start
// or after a non-word character, so e-mail addresses are not mentions.
const MENTION_RE = /(^|[^\w@])@([A-Za-z0-9_.]{1,30})/g;

/** Distinct usernames mentioned in `text`, in order of appearance. */
export const parseMentions = (text: string | null | undefined): string[] => {
  if (!text) return [];
  const names = Array.from(text.matchAll(MENTION_RE), (m) => m[2].replace(/\.+$/, "")).filter(Boolean);
  return [...new Set(names)];
};

/**
 * `text` with every @mention turned into a link to that user's profile. Plain
 * text otherwise (keep `whitespace-pre-wrap` on the container for line breaks).
 */
export const renderMentionText = (text: string | null | undefined, linkClassName?: string): ReactNode => {
  if (!text) return text ?? null;
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(MENTION_RE)) {
    const username = m[2].replace(/\.+$/, "");
    if (!username) continue;
    const at = (m.index ?? 0) + m[1].length; // position of "@"
    if (at > last) parts.push(text.slice(last, at));
    parts.push(
      <Link
        key={`${at}-${username}`}
        to={`/home/profile/${encodeURIComponent(username)}`}
        onClick={(e) => e.stopPropagation()}
        className={linkClassName ?? "font-semibold text-primary dark:text-[#7fd1c9] hover:underline"}
      >
        @{username}
      </Link>
    );
    last = at + 1 + username.length;
  }
  if (last === 0) return text;
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};
