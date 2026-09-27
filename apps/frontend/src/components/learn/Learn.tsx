"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PiArrowRight, PiCheckCircleFill, PiCircle, PiPlayFill } from "react-icons/pi";
import type { LearnData, Quest } from "@tradexcel/shared";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import { getLearn, startPractice } from "../../api/api";
import { useAsyncEffect } from "../../hooks/useAsyncEffect";
import { changeTextClass } from "../market/marketColors";
import { Card } from "../ui/Panel";

const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

function QuestItem({ quest, open, onToggle }: { quest: Quest; open: boolean; onToggle: () => void }) {
  const done = Boolean(quest.completedAt);
  return (
    <li className="py-1">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60"
      >
        {done ? (
          <PiCheckCircleFill aria-label="Done" className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
        ) : (
          <PiCircle aria-label="Not done yet" className="h-5 w-5 shrink-0 text-gray-400" />
        )}
        <span className={`flex-1 text-sm font-medium ${done ? "text-gray-500 line-through decoration-gray-300 dark:text-gray-400 dark:decoration-gray-600" : ""}`}>
          {quest.title}
        </span>
      </button>
      {open && (
        <div className="ml-10 mr-2 mb-2 space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">{quest.lesson}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <Link href={quest.cta.href} className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline dark:text-blue-400">
              {quest.cta.label} <PiArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            {quest.texQuestion && <span className="text-xs text-gray-500 dark:text-gray-400">Or ask Tex: “{quest.texQuestion}”</span>}
          </div>
        </div>
      )}
    </li>
  );
}

// Quests (guided first steps, each with a short lesson) and practice runs
// (replays of real market episodes, stepped a day at a time).
function Learn() {
  const router = useRouter();
  const [data, setData] = useState<LearnData | null>(null);
  const [error, setError] = useState("");
  const [openQuest, setOpenQuest] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  const load = useCallback(async (isActive: () => boolean) => {
    try {
      const next = await getLearn();
      if (!isActive()) return;
      setData(next);
      // Open the first unfinished quest so there's always a clear next step.
      setOpenQuest((prev) => prev ?? next.quests.find((q) => !q.completedAt)?.id ?? null);
    } catch (err) {
      if (isActive()) setError(err instanceof Error ? err.message : "We couldn't load your quests.");
    }
  }, []);

  useAsyncEffect((isActive) => load(isActive), [load]);

  const start = async (scenarioId: string) => {
    if (data?.activePracticeId && !window.confirm("Starting a new run ends the one you're in the middle of. Continue?")) return;
    try {
      setStarting(scenarioId);
      const run = await startPractice(scenarioId);
      router.push(`/learn/practice/${run.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "We couldn't start that practice run.");
      setStarting(null);
    }
  };

  const doneCount = data?.quests.filter((q) => q.completedAt).length ?? 0;
  const total = data?.quests.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 font-pop text-gray-900 transition-colors duration-300 dark:bg-gray-800 dark:text-white">
      <Header />
      <div className="flex">
        <Vheader />
        <main className="mb-20 min-w-0 flex-1 space-y-4 md:mb-0 px-5 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Learn</h1>
            <div className="mt-1 h-0.5 w-24 rounded-full bg-blue-600 dark:bg-blue-400 animate-line" />
            <p className="mt-3 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Short lessons with something to try, and replays of real market moments you can trade through at your own pace.
            </p>
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}

          {!data ? (
            !error && (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="h-96 animate-pulse rounded-2xl bg-white dark:bg-gray-900" />
                <div className="h-96 animate-pulse rounded-2xl bg-white dark:bg-gray-900" />
              </div>
            )
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card
                title="Quests"
                action={
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {doneCount} of {total} done
                  </span>
                }
              >
                <div
                  role="progressbar"
                  aria-label="Quests completed"
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={doneCount}
                  className="mb-3 h-2 rounded-full bg-gray-100 dark:bg-gray-800"
                >
                  <div className="h-2 rounded-full bg-blue-600 transition-[width] duration-500 dark:bg-blue-400" style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }} />
                </div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {doneCount === total ? "🎓 All done. You've earned the Graduate badge." : "Finish them all to earn the 🎓 Graduate badge."}
                </p>
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.quests.map((q) => (
                    <QuestItem key={q.id} quest={q} open={openQuest === q.id} onToggle={() => setOpenQuest((prev) => (prev === q.id ? null : q.id))} />
                  ))}
                </ul>
              </Card>

              <div id="practice" className="scroll-mt-24">
                <Card
                  title="Practice runs"
                  action={
                    data.activePracticeId ? (
                      <Link
                        href={`/learn/practice/${data.activePracticeId}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Resume your run <PiArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    ) : undefined
                  }
                >
                  <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                    Trade through a real market episode with ₹1,00,000 of practice money. Move to the next day whenever you&apos;re ready. Nothing here affects your wallet or rank.
                  </p>
                  <ul className="space-y-3">
                    {data.scenarios.map((s) => {
                      const best = data.history.filter((h) => h.scenarioId === s.id).sort((a, b) => b.returnPct - a.returnPct)[0];
                      return (
                        <li key={s.id} className="rounded-xl p-3 ring-1 ring-gray-200 dark:ring-gray-800">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium">{s.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {s.period} · {s.days} trading days · {s.symbols.length} stocks
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => start(s.id)}
                              disabled={starting !== null}
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              <PiPlayFill aria-hidden="true" className="h-3.5 w-3.5" />
                              {starting === s.id ? "Loading prices..." : "Start"}
                            </button>
                          </div>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{s.blurb}</p>
                          {best && (
                            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                              Your best: <span className={`font-medium ${changeTextClass(best.returnPct)}`}>{pct(best.returnPct)}</span>
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Learn;
