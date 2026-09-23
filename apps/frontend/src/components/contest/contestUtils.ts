// Shared by the contest list and detail views.
export const STATUS_STYLES: Record<string, string> = {
  UPCOMING: "bg-yellow-500",
  LIVE: "bg-green-500",
  ENDED: "bg-gray-500",
};

export const MEDALS = ["🥇", "🥈", "🥉"];

export function contestProgress(contest: { startAt: string; endAt: string; status: string }) {
  if (contest.status === "ENDED") return 100;
  if (contest.status === "UPCOMING") return 0;
  const start = new Date(contest.startAt).getTime();
  const end = new Date(contest.endAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
}
