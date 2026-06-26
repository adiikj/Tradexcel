import prisma from "./prisma.js";

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to PostgreSQL via Prisma");
  } catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1);
  }
};

export default connectDB;
