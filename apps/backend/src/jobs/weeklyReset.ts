import cron from "node-cron";
import { runWeeklyReset } from "../services/weeklyReset.js";
import logger from "../utils/logger.js";

export function startWeeklyResetJob() {
  // Run once at startup so a boundary missed while the server was down
  // (deploys, restarts) still gets settled as soon as it comes back up.
  runWeeklyReset().catch((error) => logger.error({ err: error }, "Weekly reset (startup) failed"));

  cron.schedule(
    "0 0 * * 1",
    () => {
      runWeeklyReset().catch((error) => logger.error({ err: error }, "Weekly reset failed"));
    },
    { timezone: "Etc/UTC" }
  );
}
