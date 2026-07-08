import cron from "node-cron";
import { runWeeklyReset } from "../services/weeklyReset.js";

export function startWeeklyResetJob() {
  // Run once at startup so a boundary missed while the server was down
  // (deploys, restarts) still gets settled as soon as it comes back up.
  runWeeklyReset().catch((error) => console.error("Weekly reset (startup) failed:", error));

  cron.schedule(
    "0 0 * * 1",
    () => {
      runWeeklyReset().catch((error) => console.error("Weekly reset failed:", error));
    },
    { timezone: "Etc/UTC" }
  );
}
