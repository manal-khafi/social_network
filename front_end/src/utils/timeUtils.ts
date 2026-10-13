const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Tolerated clock difference between this device and the server.
const CLOCK_SKEW_MS = 5 * MINUTE;

const formatDate = (date: Date, now: Date): string =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });

/**
 * Relative time for an ISO string / Date: "Just now", "5m ago", "3h ago",
 * "2d ago", then the date itself ("Oct 6") from a week on. Computed at call
 * time: pair it with useTimeTicker() so it is re-evaluated as time passes.
 */
export const formatTime = (dateInput?: string | Date | null): string => {
  if (!dateInput) return "—";

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // A timestamp well in the future has no meaningful "ago": show its date
  // rather than a "Just now" that would never change.
  if (diff < -CLOCK_SKEW_MS) return formatDate(date, now);

  if (diff < MINUTE) return "Just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return formatDate(date, now);
};
