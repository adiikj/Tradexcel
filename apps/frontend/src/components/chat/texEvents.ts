// Lets other parts of the app (e.g. the header's "Ask Tex" button) open the
// chat panel without sharing state with it.
export const OPEN_TEX_EVENT = "tex:open";

export function openTex() {
  window.dispatchEvent(new Event(OPEN_TEX_EVENT));
}
