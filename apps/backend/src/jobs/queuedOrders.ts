import cron from "node-cron";
import { fillQueuedOrders } from "../services/queuedOrders.js";
import logger from "../utils/logger.js";

export function startQueuedOrdersJob() {
  cron.schedule("* * * * *", () => {
    fillQueuedOrders()
      .then(({ filled, failed }) => {
        if (filled || failed) logger.info({ filled, failed }, "Processed queued orders");
      })
      .catch((error) => logger.error({ err: error }, "Queued order fill failed"));
  });
}
