"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import alert from "../../assets/alerts.png";
import alert_w from "../../assets/alerts-w.png";
import { getAlerts, getNotifications, markNotificationsRead } from "../../api/api";

const NOTIFICATION_POLL_MS = 20000;

// Synthesizes a short two-tone chime with the Web Audio API so no sound
// asset needs to ship with the app. Browsers block audio until the user
// has interacted with the page at least once - failures are swallowed.
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
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

const Alerts = ({ darkMode }) => {
  const [alertsOpen, setAlertsOpen] = useState<any>(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [justArrived, setJustArrived] = useState(false);
  const alertsRef = useRef(null);
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
          .filter((a: any) => a.triggered)
          .map((a: any) => ({
            id: `alert-${a.id}`,
            message: `${a.symbol} went ${a.direction === "ABOVE" ? "above" : "below"} ₹${a.targetPrice}`,
            time: a.triggeredAt,
            link: null,
          }));

        const followNotifications = (notificationsRes?.data?.notifications || []).map((n: any) => ({
          id: `notif-${n.id}`,
          message: n.message,
          time: n.createdAt,
          link: n.link,
        }));

        const merged = [...triggeredAlerts, ...followNotifications].sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
        );

        const currentIds = new Set(merged.map((n) => n.id));
        const isFirstLoad = seenIdsRef.current === null;
        const hasNewArrival =
          !isFirstLoad && merged.some((n) => !seenIdsRef.current!.has(n.id));

        if (hasNewArrival && !alertsOpenRef.current) {
          playNotificationChime();
          setJustArrived(true);
          setTimeout(() => setJustArrived(false), 650);
        }

        seenIdsRef.current = currentIds;
        setNotifications(merged);
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

  const handleAlertsClick = () => {
    setAlertsOpen((prevState) => !prevState);
    if (unreadCount > 0) {
      setUnreadCount(0);
      markNotificationsRead().catch(() => {});
    }
  };

  const handleClearNotification = (id) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id)
    );
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (alertsRef.current && !alertsRef.current.contains(event.target)) {
        setAlertsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={alertsRef} className="relative">
      <div
        onClick={handleAlertsClick}
        className={`relative flex items-center p-2 rounded-md cursor-pointer transition-all duration-300 ${
          alertsOpen
            ? darkMode
              ? "bg-gray-700 text-white"
              : "bg-gray-200 text-black"
            : darkMode
            ? "text-white"
            : "text-black"
        }`}
      >
        <img
          className={`w-5 h-5 sm:w-6 sm:h-6 ${justArrived ? "animate-bell-ring" : ""}`}
          src={((darkMode ? alert_w : alert)?.src || (darkMode ? alert_w : alert)) as string}
          alt="Alerts"
        />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold leading-none ${
              justArrived ? "scale-125" : "scale-100"
            } transition-transform duration-300`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      {alertsOpen && (
        <div
          className={`absolute w-72 sm:w-96 md:w-80 lg:w-96 ${
            darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
          } rounded-md shadow-lg z-10 p-4 max-h-80 overflow-y-auto top-10 sm:top-12 md:left-0 left-1/2 transform -translate-x-1/2`}
        >
          <h4 className="font-bold text-base md:text-lg mb-4">Notifications</h4>
          <ul className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const content = (
                  <div className="flex-1">
                    <p className="font-medium text-sm md:text-base">{notification.message}</p>
                    <small className="text-gray-400 text-xs md:text-sm">
                      {new Date(notification.time).toLocaleString("en-IN")}
                    </small>
                  </div>
                );

                return (
                  <li
                    key={notification.id}
                    className={`flex justify-between items-start gap-2 p-3 rounded-md shadow-sm ${
                      darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"
                    } transition-all duration-300`}
                  >
                    {notification.link ? (
                      <Link href={notification.link} onClick={() => setAlertsOpen(false)} className="flex-1">
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                    <button
                      onClick={() => handleClearNotification(notification.id)}
                      className={`text-sm md:text-sm px-3 py-1 rounded ${
                        darkMode
                          ? "bg-red-500 hover:bg-red-400 text-white"
                          : "bg-red-100 hover:bg-red-200 text-red-600"
                      }`}
                    >
                      Clear
                    </button>
                  </li>
                );
              })
            ) : (
              <p className="text-center text-gray-400">No notifications</p>
            )}
          </ul>

          {notifications.length > 0 && (
            <div className="mt-4 text-center">
              <button
                onClick={handleClearAllNotifications}
                className={`px-4 py-2 rounded-md text-sm ${
                  darkMode
                    ? "bg-red-500 hover:bg-red-400 text-white"
                    : "bg-red-100 hover:bg-red-200 text-red-600"
                }`}
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Alerts;
