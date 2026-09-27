import cron from "node-cron";
import { resolvePredictions } from "../services/predictions.js";
import logger from "../utils/logger.js";

function run() {
  resolvePredictions()
    .then((count) => {
      if (count) logger.info({ count }, "Resolved daily calls");
    })
    .catch((error) => logger.error({ err: error }, "Resolving daily calls failed"));
}

export function startPredictionsJob() {
  // Catch up on anything missed while the server was down.
  run();
  // 3:45 PM IST, after the close settles, Monday to Friday.
  cron.schedule("45 15 * * 1-5", run, { timezone: "Asia/Kolkata" });
}
