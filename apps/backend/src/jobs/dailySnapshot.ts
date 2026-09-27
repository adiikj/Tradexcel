import cron from "node-cron";
import { recordDailySnapshots } from "../services/analytics.js";
import logger from "../utils/logger.js";

export function startDailySnapshotJob() {
  // 3:35 PM IST, just after the close, Monday to Friday.
  cron.schedule(
    "35 15 * * 1-5",
    () => {
      recordDailySnapshots()
        .then((count) => logger.info({ count }, "Recorded daily net worth snapshots"))
        .catch((error) => logger.error({ err: error }, "Daily snapshot failed"));
    },
    { timezone: "Asia/Kolkata" }
  );
}
