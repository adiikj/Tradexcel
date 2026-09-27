"use client";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { PiArrowDownBold, PiArrowUpBold, PiFireFill } from "react-icons/pi";
import type { PredictionData } from "@tradexcel/shared";
import { getPrediction, makePrediction } from "../../api/api";
import { useAsyncEffect } from "../../hooks/useAsyncEffect";
import { Card } from "../ui/Panel";

const dayName = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });

// The daily call: will NIFTY 50 close up or down next session? You can change
// your pick until the market opens. Right or wrong shows up after the close.
function DailyCall() {
  const [data, setData] = useState<PredictionData | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (isActive: () => boolean) => {
    try {
      const next = await getPrediction();
      if (isActive()) setData(next);
    } catch {
      // The card just doesn't show; nothing else depends on it.
    }
  }, []);
  useAsyncEffect((isActive) => load(isActive), [load]);

  if (!data) return null;

  const pick = async (direction: "UP" | "DOWN") => {
    try {
      setSaving(true);
      setData(await makePrediction(direction));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "We couldn't save your call.");
    } finally {
      setSaving(false);
    }
  };

  const { stats, crowd } = data;
  const crowdTotal = crowd.up + crowd.down;
  const option = (direction: "UP" | "DOWN") => {
    const chosen = data.pick === direction;
    const up = direction === "UP";
    const Icon = up ? PiArrowUpBold : PiArrowDownBold;
    return (
      <button
        type="button"
        aria-pressed={chosen}
        disabled={saving}
        onClick={() => pick(direction)}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold ring-1 transition-colors disabled:opacity-60 ${
          chosen
            ? up
              ? "bg-green-600 text-white ring-green-600"
              : "bg-red-600 text-white ring-red-600"
            : "ring-gray-200 hover:bg-gray-50 dark:ring-gray-700 dark:hover:bg-gray-800"
        }`}
      >
        <Icon aria-hidden="true" className="h-4 w-4" /> {up ? "Up" : "Down"}
      </button>
    );
  };

  return (
    <Card
      title="Daily call"
      action={
        stats.currentStreak > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            <PiFireFill aria-hidden="true" className="h-3.5 w-3.5" /> {stats.currentStreak} in a row
          </span>
        ) : undefined
      }
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-sm">
            Will <span className="font-semibold">NIFTY 50</span> close up or down on {dayName(data.date)}?
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {data.pick ? "You can change your call until the market opens." : "Make your call before the market opens."}
            {crowdTotal > 0 && ` ${Math.round((crowd.up / crowdTotal) * 100)}% of players say up.`}
          </p>
          <div className="mt-3 flex max-w-xs gap-2">
            {option("UP")}
            {option("DOWN")}
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-4 text-center sm:text-right">
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Right</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {stats.correct}/{stats.calls}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Streak</dt>
            <dd className="text-lg font-semibold tabular-nums">{stats.currentStreak}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Best</dt>
            <dd className="text-lg font-semibold tabular-nums">{stats.bestStreak}</dd>
          </div>
        </dl>
      </div>
      {data.recent.length > 0 && (
        <ul aria-label="Your recent calls" className="mt-4 flex flex-wrap gap-1.5">
          {data.recent.map((r) => (
            <li
              key={r.date}
              title={`${dayName(r.date)}: said ${r.direction === "UP" ? "up" : "down"}, ${r.correct === null ? "flat day" : r.correct ? "right" : "wrong"}`}
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                r.correct === null
                  ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  : r.correct
                    ? "bg-green-600/10 text-green-700 dark:text-green-300"
                    : "bg-red-600/10 text-red-600 dark:text-red-400"
              }`}
            >
              {new Date(`${r.date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" })} {r.correct === null ? "–" : r.correct ? "✓" : "✗"}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default DailyCall;
