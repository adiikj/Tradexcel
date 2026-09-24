// Weekly seasons: every wallet resets on Monday 00:00 UTC (backend weeklyReset.ts).
export const STARTING_BALANCE = 100000;

export function seasonStart(now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

export function nextReset(now = new Date()): Date {
  const d = seasonStart(now);
  d.setUTCDate(d.getUTCDate() + 7);
  return d;
}

// "2d 5h", "5h 12m", "12m"
export function formatCountdown(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
