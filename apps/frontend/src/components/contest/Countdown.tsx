"use client";
import React, { useEffect, useState } from "react";

function formatRemaining(ms: number) {
  if (ms <= 0) return "0s";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function Countdown({ target, label }: { target: string | Date; label: string }) {
  const targetTime = new Date(target).getTime();
  const [remaining, setRemaining] = useState(() => targetTime - Date.now());

  useEffect(() => {
    const interval = setInterval(() => setRemaining(targetTime - Date.now()), 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return (
    <span>
      {label} {formatRemaining(remaining)}
    </span>
  );
}

export default Countdown;
