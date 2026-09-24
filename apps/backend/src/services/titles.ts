// Live-computed prestige title, separate from the permanent achievement
// badges (services/achievements.ts). Titles reflect *current standing*
// (P&L tier, with a #1-leaderboard override) and can change day to day -
// nothing is persisted, this is just a label derived from stats the caller
// already has on hand.
export interface Title {
  name: string;
  icon: string;
}

export const LEADERBOARD_TOP_TITLE: Title = { name: "Market Legend", icon: "🏔️" };

// Checked top-down: the first tier whose `above` the P&L % strictly exceeds
// wins. The last tier (above = -Infinity) is the catch-all. Exported so the
// chat knowledge base describes the same thresholds the game uses.
export const TITLE_TIERS: (Title & { above: number })[] = [
  { name: "Trading Legend", icon: "👑", above: 50 },
  { name: "Market Wizard", icon: "🧙", above: 25 },
  { name: "Bull Runner", icon: "🐂", above: 10 },
  { name: "Steady Hand", icon: "✋", above: 0 },
  { name: "Rookie Trader", icon: "🌱", above: -10 },
  { name: "Rekt", icon: "💀", above: -Infinity },
];

export function getTitle(pnlPercent: number, rank: number | null): Title {
  if (rank === 1) return LEADERBOARD_TOP_TITLE;
  // NaN matches no tier; fall through to the catch-all like the comparisons would.
  const tier = TITLE_TIERS.find((t) => pnlPercent > t.above) ?? TITLE_TIERS[TITLE_TIERS.length - 1];
  return { name: tier.name, icon: tier.icon };
}
