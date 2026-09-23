import { useSyncExternalStore } from "react";

// Reads a browser-only value (localStorage, cookies) without a
// setState-in-effect round trip: the server render and hydration use
// `serverValue`, then React switches to the real value. Call
// notifyBrowserValueChange() after writing so readers update; "storage"
// events cover other tabs.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function notifyBrowserValueChange() {
  listeners.forEach((listener) => listener());
}

export function useBrowserValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(subscribe, read, () => serverValue);
}
