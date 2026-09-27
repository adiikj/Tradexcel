"use client";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { PiArrowDownBold, PiArrowUpBold, PiFireFill } from "react-icons/pi";
import type { PredictionData } from "@tradexcel/shared";
import { getPrediction, makePrediction } from "../../api/api";
import { useAsyncEffect } from "../../hooks/useAsyncEffect";

const dayName = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

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
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold ring-1 transition-colors disabled:opacity-60 ${
          chosen
            ? up
              ? "bg-green-600 text-white ring-green-600"
              : "bg-red-600 text-white ring-red-600"
            : "ring-gray-200 hover:bg-gray-50 dark:ring-gray-700 dark:hover:bg-gray-800"
        }`}
      >
        <Icon aria-hidden="true" className="h-3.5 w-3.5" /> {up ? "Up" : "Down"}
      </button>
    );
  };

  // Kept small on purpose: it sits above Today's market, which matters more.
  return (
    <section aria-labelledby="daily-call-heading" className="min-w-0 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800 md:px-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="daily-call-heading" className="text-sm font-semibold">
          Daily call
        </h2>
        <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="tabular-nums" title={`Best streak: ${stats.bestStreak}`}>
            {stats.correct}/{stats.calls} right
          </span>
          {stats.currentStreak > 0 && (
            <span className="inline-flex items-center gap-0.5 font-medium text-amber-600 dark:text-amber-400">
              <PiFireFill aria-hidden="true" className="h-3.5 w-3.5" /> {stats.currentStreak}
              <span className="sr-only"> in a row</span>
            </span>
          )}
        </p>
      </div>
      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
        <span className="font-semibold">NIFTY 50</span> on {dayName(data.date)}: up or down?
        {data.pick && crowdTotal > 0 && (
          <span className="text-gray-500 dark:text-gray-400"> {Math.round((crowd.up / crowdTotal) * 100)}% say up.</span>
        )}
      </p>
      <div className="mt-2 flex gap-2">
        {option("UP")}
        {option("DOWN")}
      </div>
    </section>
  );
}

export default DailyCall;
