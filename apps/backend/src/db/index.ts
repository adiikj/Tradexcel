import prisma from "./prisma.js";
import logger from "../utils/logger.js";

// Neon is serverless Postgres: the compute can be suspended and has to
// resume before it accepts connections, and that resume takes a few seconds.
// Retrying with backoff means a boot that lands during a resume doesn't kill
// the process - which, on a single-instance VM, would take the API, the
// WebSocket feed and every cron job down with it.
const connectDB = async (attempts = 5) => {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await prisma.$connect();
      logger.info("Connected to PostgreSQL via Prisma");
      return;
    } catch (error) {
      logger.error({ err: error, attempt }, "Error connecting to database");
      if (attempt === attempts) {
        logger.error({ attempts }, "Database unreachable - giving up");
        process.exit(1);
      }
      // 1s, 2s, 4s, 8s, 10s
      const delay = Math.min(1000 * 2 ** (attempt - 1), 10_000);
      logger.warn({ attempt, delay }, "Retrying the database connection");
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export default connectDB;
