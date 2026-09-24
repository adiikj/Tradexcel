import { useSyncExternalStore } from "react";

// Current time rounded to the minute, as an external store: one shared ticker,
// no Date.now() during the server render (it returns null there), so
// countdowns never cause hydration mismatches.
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  timer ??= setInterval(() => listeners.forEach((l) => l()), 30_000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getMinute = () => Math.floor(Date.now() / 60_000) * 60_000;

export function useMinuteClock(): number | null {
  return useSyncExternalStore(subscribe, getMinute, () => null);
}
