import type React from "react";

// Keyboard support for clickable elements that can't be a <button> (e.g. a
// table row or a card wrapping block content): Enter/Space activate, like a
// native button.
export function onActivateKey(action: () => void) {
  return (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  };
}
