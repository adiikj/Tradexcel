import prisma from "../db/prisma.js";

function todayUTCDateOnly(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

// Called on explicit logins only, not silent token refreshes.
export async function recordLogin(userId: string): Promise<{ currentStreak: number; longestStreak: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, lastLoginDate: true },
  });
  if (!user) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const today = todayUTCDateOnly();
  const gap = user.lastLoginDate ? daysBetween(today, user.lastLoginDate) : null;

  if (gap === 0) {
    return { currentStreak: user.currentStreak, longestStreak: user.longestStreak };
  }

  const currentStreak = gap === 1 ? user.currentStreak + 1 : 1;
  const longestStreak = Math.max(user.longestStreak, currentStreak);

  await prisma.user.update({
    where: { id: userId },
    data: { currentStreak, longestStreak, lastLoginDate: today },
  });

  return { currentStreak, longestStreak };
}
