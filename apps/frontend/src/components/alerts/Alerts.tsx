"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  PiArrowRight,
  PiBellSimple,
  PiBellSimpleRinging,
  PiBellSlash,
  PiChecks,
  PiTrendDown,
  PiTrendUp,
  PiTrophyFill,
  PiUserPlus,
  PiX,
  PiClockCountdown,
} from "react-icons/pi";
import { getAlerts, getNotifications, markNotificationsRead } from "../../api/api";
import { HEADER_BADGE, HEADER_ICON_BUTTON } from "../layout/headerStyles";
import { timeAgo } from "../../utils/format";
import Avatar from "../ui/Avatar";

const NOTIFICATION_POLL_MS = 20000;

// Synthesizes a short two-tone chime with the Web Audio API so no sound
// asset needs to ship with the app. Browsers block audio until the user
// has interacted with the page at least once - failures are swallowed.
function playNotificationChime() {
  try {
    const AudioCtx =
      window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.1;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });

    setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch {
    // Ignore - audio is a nice-to-have, never block on it.
  }
}

// One row in the bell panel: a triggered price alert or a social notification.
type BellKind = "alert-up" | "alert-down" | "follow" | "achievement" | "order";
type BellItem = {
  id: string;
  kind: BellKind;
  message: string;
  time: string;
  link: string | null;
  unread: boolean;
  avatar?: string | null;
};

// Icon bubble per kind; followers show their own avatar instead.
function BellIcon({ item }: { item: BellItem }) {
  if (item.kind === "follow" && item.avatar !== undefined) {
    return (
      <span className="relative shrink-0">
        <Avatar src={item.avatar} size={36} className="h-9 w-9 rounded-full object-cover" />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white ring-2 ring-white dark:ring-gray-900">
          <PiUserPlus aria-hidden="true" className="h-2.5 w-2.5" />
        </span>
      </span>
    );
  }
  const styles: Record<BellKind, { icon: React.ReactNode; className: string }> = {
    "alert-up": { icon: <PiTrendUp aria-hidden="true" className="h-5 w-5" />, className: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300" },
    "alert-down": { icon: <PiTrendDown aria-hidden="true" className="h-5 w-5" />, className: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300" },
    follow: { icon: <PiUserPlus aria-hidden="true" className="h-5 w-5" />, className: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300" },
    achievement: { icon: <PiTrophyFill aria-hidden="true" className="h-5 w-5" />, className: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" },
    order: { icon: <PiClockCountdown aria-hidden="true" className="h-5 w-5" />, className: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300" },
  };
  const { icon, className } = styles[item.kind];
  return <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${className}`}>{icon}</span>;
}

const Alerts = () => {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [notifications, setNotifications] = useState<BellItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [justArrived, setJustArrived] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);
  const alertsOpenRef = useRef(false);
  const seenIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    alertsOpenRef.current = alertsOpen;
  }, [alertsOpen]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const [alertsRes, notificationsRes] = await Promise.all([getAlerts(), getNotifications()]);
        if (cancelled) return;

        const triggeredAlerts = (alertsRes?.data || [])
          .filter((a) => a.triggered)
          .map((a): BellItem => ({
            id: `alert-${a.id}`,
            kind: a.direction === "ABOVE" ? "alert-up" : "alert-down",
            message: `${a.symbol.replace(/\.NS$/, "")} went ${a.direction === "ABOVE" ? "above" : "below"} ₹${Number(a.targetPrice).toLocaleString("en-IN")}`,
            time: a.triggeredAt ?? a.createdAt,
            link: `/market?symbol=${encodeURIComponent(a.symbol)}`,
            unread: false,
          }));

        const socialNotifications = (notificationsRes?.data?.notifications || []).map((n): BellItem => ({
          id: `notif-${n.id}`,
          kind: n.type === "ACHIEVEMENT" ? "achievement" : n.type === "ORDER" ? "order" : "follow",
          message: n.message,
          time: n.createdAt,
          link: n.link,
          unread: !n.read,
          avatar: n.actor ? n.actor.avatar : undefined,
        }));

        const merged = [...triggeredAlerts, ...socialNotifications].sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
        );

        const currentIds = new Set(merged.map((n) => n.id));
        const isFirstLoad = seenIdsRef.current === null;
        const hasNewArrival = !isFirstLoad && merged.some((n) => !seenIdsRef.current!.has(n.id));

        if (hasNewArrival && !alertsOpenRef.current) {
          playNotificationChime();
          setJustArrived(true);
          setTimeout(() => setJustArrived(false), 650);
        }

        seenIdsRef.current = currentIds;
        // While the panel is open, keep this session's "new" dots instead of
        // letting a poll wipe them (the server already counts them as read).
        setNotifications((prev) => {
          if (!alertsOpenRef.current) return merged;
          const shownUnread = new Set(prev.filter((n) => n.unread).map((n) => n.id));
          return merged.map((n) => (shownUnread.has(n.id) ? { ...n, unread: true } : n));
        });
        setUnreadCount(notificationsRes?.data?.unreadCount || 0);
      } catch {
        // Keep showing the last known state if a poll fails.
      }
    };

    poll();
    const interval = setInterval(poll, NOTIFICATION_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const closePanel = () => {
    setAlertsOpen(false);
    // Items seen in this session stop showing as new.
    setNotifications((prev) => prev.map((n) => (n.unread ? { ...n, unread: false } : n)));
  };

  const handleAlertsClick = () => {
    if (alertsOpen) return closePanel();
    setAlertsOpen(true);
    if (unreadCount > 0) {
      setUnreadCount(0);
      markNotificationsRead().catch(() => {});
    }
  };

  const handleClearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  // Close on outside click or Escape.
  useEffect(() => {
    if (!alertsOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (alertsRef.current && !alertsRef.current.contains(event.target as Node)) closePanel();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [alertsOpen]);

  const newCount = notifications.filter((n) => n.unread).length;
  const BellGlyph = justArrived ? PiBellSimpleRinging : PiBellSimple;

  return (
    <div ref={alertsRef} className="relative">
      <button
        type="button"
        onClick={handleAlertsClick}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
        aria-expanded={alertsOpen}
        aria-haspopup="dialog"
        className={`${HEADER_ICON_BUTTON} ${alertsOpen ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white" : ""}`}
      >
        <BellGlyph aria-hidden="true" className={`h-5 w-5 ${justArrived ? "animate-bell-ring" : ""}`} />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className={`${HEADER_BADGE} bg-red-500 transition-transform duration-300 ${justArrived ? "scale-125" : "scale-100"}`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {alertsOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-2 top-[4.25rem] z-40 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl bg-white font-pop text-gray-900 shadow-2xl ring-1 ring-gray-200 dark:bg-gray-900 dark:text-white dark:ring-gray-700 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[22rem]"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Notifications</h2>
              {newCount > 0 && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                  {newCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllNotifications}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <PiChecks aria-hidden="true" className="h-4 w-4" /> Clear all
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length > 0 ? (
            <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
              {notifications.map((notification) => {
                const content = (
                  <>
                    <BellIcon item={notification} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug text-gray-800 dark:text-gray-100">{notification.message}</span>
                      <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                        <time dateTime={notification.time} title={new Date(notification.time).toLocaleString("en-IN")}>
                          {timeAgo(notification.time)}
                        </time>
                      </span>
                    </span>
                  </>
                );
                return (
                  <li
                    key={notification.id}
                    className={`group relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                      notification.unread ? "bg-blue-50/60 dark:bg-blue-500/5" : ""
                    }`}
                  >
                    {notification.unread && (
                      <span aria-label="New" className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-blue-500" />
                    )}
                    {notification.link ? (
                      <Link
                        href={notification.link}
                        onClick={closePanel}
                        className="flex min-w-0 flex-1 items-start gap-3 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        {content}
                      </Link>
                    ) : (
                      <span className="flex min-w-0 flex-1 items-start gap-3">{content}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleClearNotification(notification.id)}
                      aria-label={`Dismiss: ${notification.message}`}
                      className="shrink-0 rounded-full p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-200 hover:text-gray-700 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      <PiX aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                <PiBellSlash aria-hidden="true" className="h-6 w-6" />
              </span>
              <p className="text-sm font-medium">You&apos;re all caught up</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Price alerts, new followers and badges show up here.</p>
            </div>
          )}

          {/* Footer */}
          <Link
            href="/alerts"
            onClick={closePanel}
            className="flex items-center justify-center gap-1.5 border-t border-gray-100 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-gray-50 dark:border-gray-800 dark:text-blue-400 dark:hover:bg-gray-800/60"
          >
            Manage price alerts <PiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default Alerts;
