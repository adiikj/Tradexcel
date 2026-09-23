import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Modal from "./Modal";

describe("Modal", () => {
  it("is an accessible dialog that takes focus", () => {
    render(
      <Modal label="Buy TCS" onClose={() => {}}>
        <p>body</p>
      </Modal>
    );
    const dialog = screen.getByRole("dialog", { name: "Buy TCS" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement).toBe(dialog);
  });

  it("closes on Escape and on backdrop click, not on clicks inside", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal label="Buy TCS" onClose={onClose}>
        <button>inside</button>
      </Modal>
    );

    fireEvent.click(screen.getByText("inside"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(container.firstChild as Element);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("returns focus to the trigger when it closes", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = render(
      <Modal label="Buy TCS" onClose={() => {}}>
        <p>body</p>
      </Modal>
    );
    unmount();

    expect(document.activeElement).toBe(trigger);
  });
});
