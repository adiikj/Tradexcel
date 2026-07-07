const MS_PER_DAY = 86_400_000;

// Maps "now" onto a historical trading date for a replay contest; null for
// an ordinary live-price contest (no historicalDates).
export function resolveSimulatedDate(
  contest: { startAt: Date; historicalDates: Date[] },
  now: Date = new Date()
): Date | null {
  if (contest.historicalDates.length === 0) {
    return null;
  }

  const daysElapsed = Math.floor((now.getTime() - contest.startAt.getTime()) / MS_PER_DAY);
  const dayIndex = Math.min(Math.max(daysElapsed, 0), contest.historicalDates.length - 1);
  return contest.historicalDates[dayIndex];
}
