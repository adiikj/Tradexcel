// Shown while a route's code and data load on navigation. Colours read on both
// themes because the page background comes from html[data-theme].
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="min-h-screen flex items-center justify-center">
      <span className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
