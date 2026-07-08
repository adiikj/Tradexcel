import firstTrade from "../../assets/badges/first_trade.png";
import inTheGreen from "../../assets/badges/in_the_green.png";
import centuryClub from "../../assets/badges/century_club.png";
import bigWinner from "../../assets/badges/big_winner.png";
import diversified from "../../assets/badges/diversified.png";
import streak3 from "../../assets/badges/streak_3.png";
import streak7 from "../../assets/badges/streak_7.png";
import streak30 from "../../assets/badges/streak_30.png";
import contestChampion from "../../assets/badges/contest_champion.png";
import podiumFinish from "../../assets/badges/podium_finish.png";
import weeklyChampion from "../../assets/badges/weekly_champion.png";
import topOfLeaderboard from "../../assets/badges/top_of_leaderboard.png";
import leagueHost from "../../assets/badges/league_host.png";
import socialButterfly from "../../assets/badges/social_butterfly.png";
import greenShoots from "../../assets/badges/green_shoots.png";
import steadyGrower from "../../assets/badges/steady_grower.png";
import teamPlayer from "../../assets/badges/team_player.png";
import networker from "../../assets/badges/networker.png";

// Cropped from the achievements.png sprite sheet provided for this feature.
// Keyed by the same badgeId the backend catalog uses
// (apps/backend/src/services/achievements.ts), so this is the one place to
// touch when new badge art lands.
const BADGE_ICONS: Record<string, any> = {
  first_trade: firstTrade,
  in_the_green: inTheGreen,
  century_club: centuryClub,
  big_winner: bigWinner,
  diversified: diversified,
  streak_3: streak3,
  streak_7: streak7,
  streak_30: streak30,
  contest_champion: contestChampion,
  podium_finish: podiumFinish,
  weekly_champion: weeklyChampion,
  top_of_leaderboard: topOfLeaderboard,
  league_host: leagueHost,
  social_butterfly: socialButterfly,
  green_shoots: greenShoots,
  steady_grower: steadyGrower,
  team_player: teamPlayer,
  networker: networker,
};

// Returns the icon image src for a badge if art exists, or null so callers
// can fall back to the emoji the backend already sends.
export function getBadgeIconSrc(badgeId: string): string | null {
  const asset = BADGE_ICONS[badgeId];
  if (!asset) return null;
  return (asset?.src || asset) as string;
}
