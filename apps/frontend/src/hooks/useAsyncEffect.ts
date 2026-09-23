import { useEffect, type DependencyList } from "react";

// Runs an async load when deps change. `isActive()` turns false once the deps
// change again or the component unmounts, so the load can drop a stale
// response instead of overwriting newer state (e.g. fast tab switches).
// Loads only set state after awaiting, never synchronously in the effect.
export function useAsyncEffect(load: (isActive: () => boolean) => Promise<unknown>, deps: DependencyList) {
  useEffect(() => {
    let active = true;
    load(() => active).catch(() => {
      // Loads handle their own errors; this only guards against unhandled rejections.
    });
    return () => {
      active = false;
    };
    // Deps are checked at call sites (see additionalHooks in eslint.config.mjs).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
