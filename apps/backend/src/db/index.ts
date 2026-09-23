import prisma from "./prisma.js";
import logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info("Connected to PostgreSQL via Prisma");
  } catch (error) {
    logger.error({ err: error }, "Error connecting to database");
    process.exit(1);
  }
};

export default connectDB;
