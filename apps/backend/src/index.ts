// Must be the first import: ES imports are hoisted, so modules that read
// process.env at load time (e.g. config/cors.ts) would otherwise see nothing.
// dotenv never overrides variables already set by the host in production.
import 'dotenv/config';
import connectDB from './db/index.js';
import prisma from './db/prisma.js';
import { app } from './app.js';
import type { Server } from 'node:http';
import { startContestSettlementJob } from './jobs/contestSettlement.js';
import { startAlertCheckerJob } from './jobs/alertChecker.js';
import { startWeeklyResetJob } from './jobs/weeklyReset.js';
import { startQueuedOrdersJob } from './jobs/queuedOrders.js';
import { startDailySnapshotJob } from './jobs/dailySnapshot.js';
import { startPredictionsJob } from './jobs/predictions.js';
import { initPriceSocket } from './realtime/priceSocket.js';
import { chatEnabled } from './chat/runtime/config.js';
import { warmChatEngine } from './chat/runtime/engine.js';
import logger from "./utils/logger.js";

// How long a shutdown may take before the process is forced down. Long enough
// for in-flight requests to finish, short enough that a deploy doesn't hang.
const SHUTDOWN_GRACE_MS = 10_000;

// Set once the server is listening, so the shutdown handler can close it.
let serverRef: Server | undefined;

let shuttingDown = false;

// Stops the server cleanly: no new connections, let the in-flight ones finish,
// close the database pool, then exit. Without this a restart cuts requests
// mid-flight and loses the work that was detached from a request (the weekly
// recap emails, the badge awards).
const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Shutting down");

  const force = setTimeout(() => {
    logger.error("Shutdown timed out - exiting now");
    process.exit(1);
  }, SHUTDOWN_GRACE_MS);
  // Don't let the timer itself keep the process alive.
  force.unref();

  const server = serverRef;
  if (!server) {
    await prisma.$disconnect().catch(() => undefined);
    process.exit(0);
  }

  server.close(async () => {
    await prisma.$disconnect().catch(() => undefined);
    clearTimeout(force);
    logger.info("Shutdown complete");
    process.exit(0);
  });
};

connectDB()
.then(()=>{
    const server = app.listen(process.env.PORT || 8000, () => {
        logger.info(`Server is running on port ${process.env.PORT}`);
    });
    serverRef = server;

    server.on("error", (error) => {
        logger.error({ err: error }, "HTTP server error");
        throw error;
    });

    startContestSettlementJob();
    startAlertCheckerJob();
    startWeeklyResetJob();
    startQueuedOrdersJob();
    startDailySnapshotJob();
    startPredictionsJob();
    initPriceSocket(server);
    // Loads the assistant's model in the background; the server is already serving.
    if (chatEnabled()) warmChatEngine();

})
.catch((error)=>{
    logger.error({ err: error }, "Server startup failed");
    throw error;
})

// A rejected promise with nobody waiting for it used to be silent, and an
// uncaught exception left the process in an undefined state. Log both, and
// take the process down cleanly on an uncaught exception.
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  void shutdown("uncaughtException");
});

// A stop request (systemctl stop, a deploy, Ctrl-C) - finish what's in flight
// before going down.
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
