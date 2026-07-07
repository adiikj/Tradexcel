-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "historicalDates" DATE[],
ADD COLUMN     "historicalStartDate" DATE,
ALTER COLUMN "symbols" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ContestHistoricalPrice" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "close" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "ContestHistoricalPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContestHistoricalPrice_symbol_date_key" ON "ContestHistoricalPrice"("symbol", "date");
