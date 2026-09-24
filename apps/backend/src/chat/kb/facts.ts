import { STARTING_BALANCE } from "../../services/tradeMath.js";
import { MARKET_OPEN_MINUTES, MARKET_CLOSE_MINUTES } from "../../services/marketHours.js";
import { BADGE_CATALOG } from "../../services/achievements.js";
import { TITLE_TIERS, LEADERBOARD_TOP_TITLE } from "../../services/titles.js";

// Values KB answers reference as {{NAME}} (or {{BADGE:id}}), filled from the
// same constants the game runs on - so changing a rule in code can't leave the
// chatbot describing the old one.

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function clock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function titleRange(i: number): string {
  const tier = TITLE_TIERS[i];
  if (i === 0) return `over ${tier.above}%`;
  const upper = TITLE_TIERS[i - 1].above;
  if (tier.above === -Infinity) return `${upper}% or lower`;
  return `${tier.above}% to ${upper}%`;
}

export const FACTS: Record<string, string> = {
  STARTING_BALANCE: inr.format(STARTING_BALANCE),
  MARKET_OPEN: clock(MARKET_OPEN_MINUTES),
  MARKET_CLOSE: clock(MARKET_CLOSE_MINUTES),
  MARKET_HOURS: `Monday to Friday, ${clock(MARKET_OPEN_MINUTES)} to ${clock(MARKET_CLOSE_MINUTES)} IST`,
  BADGE_COUNT: String(BADGE_CATALOG.length),
  BADGE_LIST: BADGE_CATALOG.map((b) => `- ${b.icon} **${b.name}**: ${b.description}`).join("\n"),
  TITLE_LIST: [
    `- ${LEADERBOARD_TOP_TITLE.icon} **${LEADERBOARD_TOP_TITLE.name}**: #1 on the global leaderboard`,
    ...TITLE_TIERS.map((t, i) => `- ${t.icon} **${t.name}**: P&L ${titleRange(i)}`),
  ].join("\n"),
};

const BADGES = new Map(BADGE_CATALOG.map((b) => [b.id, b]));

const PLACEHOLDER = /\{\{\s*([A-Z_]+)(?::([a-z0-9_]+))?\s*\}\}/g;

// Returns the text with every placeholder filled, plus any it couldn't resolve.
export function resolvePlaceholders(text: string, facts: Record<string, string> = FACTS): { text: string; unknown: string[] } {
  const unknown: string[] = [];
  const out = text.replace(PLACEHOLDER, (match, name: string, arg?: string) => {
    if (name === "BADGE" && arg) {
      const badge = BADGES.get(arg);
      if (badge) return `${badge.icon} **${badge.name}** (${badge.description.replace(/\.$/, "")})`;
    } else if (!arg && name in facts) {
      return facts[name];
    }
    unknown.push(match);
    return match;
  });
  return { text: out, unknown };
}
