import i18n from "../i18n/i18n";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Tolerated clock difference between this device and the server.
const CLOCK_SKEW_MS = 5 * MINUTE;

const formatDate = (date: Date, now: Date): string =>
  date.toLocaleDateString(i18n.language || "en", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });

/**
 * Relative time for an ISO string / Date: "Just now", "5m ago", "3h ago",
 * "2d ago", then the date itself ("Oct 6") from a week on, in the interface
 * language (time.* keys). Computed at call time: pair it with useTimeTicker()
 * so it is re-evaluated as time passes.
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

  if (diff < MINUTE) return i18n.t("time.justNow");
  if (diff < HOUR) return i18n.t("time.minutesAgo", { count: Math.floor(diff / MINUTE) });
  if (diff < DAY) return i18n.t("time.hoursAgo", { count: Math.floor(diff / HOUR) });
  if (diff < 7 * DAY) return i18n.t("time.daysAgo", { count: Math.floor(diff / DAY) });
  return formatDate(date, now);
};
