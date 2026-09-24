// Must be the first import: ES imports are hoisted, so modules that read
// process.env at load time (e.g. config/cors.ts) would otherwise see nothing.
// dotenv never overrides variables already set by the host in production.
import 'dotenv/config';
import connectDB from './db/index.js';
import { app } from './app.js';
import { startContestSettlementJob } from './jobs/contestSettlement.js';
import { startAlertCheckerJob } from './jobs/alertChecker.js';
import { startWeeklyResetJob } from './jobs/weeklyReset.js';
import { startQueuedOrdersJob } from './jobs/queuedOrders.js';
import { initPriceSocket } from './realtime/priceSocket.js';
import logger from "./utils/logger.js";

connectDB()
.then(()=>{
    const server = app.listen(process.env.PORT || 8000, () => {
        logger.info(`Server is running on port ${process.env.PORT}`);
    });

    server.on("error", (error) => {
        logger.error({ err: error }, "HTTP server error");
        throw error;
    });

    startContestSettlementJob();
    startAlertCheckerJob();
    startWeeklyResetJob();
    startQueuedOrdersJob();
    initPriceSocket(server);

})
.catch((error)=>{
    logger.error({ err: error }, "Server startup failed");
    throw error;
})

