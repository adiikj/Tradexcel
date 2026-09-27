-- CreateEnum
CREATE TYPE "PredictionDirection" AS ENUM ('UP', 'DOWN');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CONTEST';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "weeklyRecapEmails" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "isDuel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxEntries" INTEGER,
ADD COLUMN     "maxHoldings" INTEGER,
ADD COLUMN     "maxPositionPercent" INTEGER;

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "direction" "PredictionDirection" NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "correct" BOOLEAN,
    "indexClose" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prediction_resolved_date_idx" ON "Prediction"("resolved", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_userId_date_key" ON "Prediction"("userId", "date");

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Contest rule sanity: at least one stock, a percentage in (0, 100], at least 2 players.
ALTER TABLE "Contest" ADD CONSTRAINT "Contest_maxHoldings_positive" CHECK ("maxHoldings" IS NULL OR "maxHoldings" > 0);
ALTER TABLE "Contest" ADD CONSTRAINT "Contest_maxPositionPercent_range" CHECK ("maxPositionPercent" IS NULL OR ("maxPositionPercent" > 0 AND "maxPositionPercent" <= 100));
ALTER TABLE "Contest" ADD CONSTRAINT "Contest_maxEntries_min" CHECK ("maxEntries" IS NULL OR "maxEntries" >= 2);
