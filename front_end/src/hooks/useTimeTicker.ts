import { useSyncExternalStore } from "react";

const TICK_MS = 60_000;

// One shared timer for every subscribed component, running only while at
// least one of them is mounted.
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
let tick = 0;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (timer === undefined) {
    timer = setInterval(() => {
      tick += 1;
      listeners.forEach((l) => l());
    }, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
};

const getTick = () => tick;

/**
 * Re-renders the calling component once a minute, so relative times rendered
 * with formatTime() ("5m ago") stay current while the page is open.
 */
export function useTimeTicker(): void {
  useSyncExternalStore(subscribe, getTick);
}
