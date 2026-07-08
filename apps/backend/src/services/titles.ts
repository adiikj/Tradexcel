// Live-computed prestige title, separate from the permanent achievement
// badges (services/achievements.ts). Titles reflect *current standing*
// (P&L tier, with a #1-leaderboard override) and can change day to day -
// nothing is persisted, this is just a label derived from stats the caller
// already has on hand.
export interface Title {
  name: string;
  icon: string;
}

export function getTitle(pnlPercent: number, rank: number | null): Title {
  if (rank === 1) return { name: "Market Legend", icon: "🏔️" };
  if (pnlPercent > 50) return { name: "Trading Legend", icon: "👑" };
  if (pnlPercent > 25) return { name: "Market Wizard", icon: "🧙" };
  if (pnlPercent > 10) return { name: "Bull Runner", icon: "🐂" };
  if (pnlPercent > 0) return { name: "Steady Hand", icon: "✋" };
  if (pnlPercent > -10) return { name: "Rookie Trader", icon: "🌱" };
  return { name: "Rekt", icon: "💀" };
}
