"use client";
import React, { useState } from "react";

interface ShareButtonProps {
  url: string;
  title: string;
  text: string;
}

function ShareButton({ url, title, text }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // User cancelled the share sheet; nothing to do.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; nothing more we can do here.
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-gray-200 transition-colors hover:bg-gray-50 dark:ring-gray-700 dark:hover:bg-gray-800"
    >
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

export default ShareButton;
