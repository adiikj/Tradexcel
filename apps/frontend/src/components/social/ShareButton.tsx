"use client";
import React, { useState } from "react";
import { FiShare2, FiCheck } from "react-icons/fi";

interface ShareButtonProps {
  url: string;
  title: string;
  text: string;
  darkMode?: boolean;
}

function ShareButton({ url, title, text, darkMode }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        // User cancelled the share sheet; nothing to do.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Clipboard unavailable; nothing more we can do here.
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
        darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
      }`}
    >
      {copied ? <FiCheck /> : <FiShare2 />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

export default ShareButton;
