"use client";
import React, { useEffect, useRef } from "react";

type ModalProps = {
  onClose: () => void;
  // Accessible name, e.g. the modal's visible heading text.
  label: string;
  maxWidth?: string;
  className?: string;
  children: React.ReactNode;
};

// Accessible dialog shell: role="dialog", Escape and backdrop click close it,
// focus moves into it on open and returns to the trigger on close.
export default function Modal({ onClose, label, maxWidth = "max-w-md", className = "", children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto shadow-xl focus:outline-none ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
