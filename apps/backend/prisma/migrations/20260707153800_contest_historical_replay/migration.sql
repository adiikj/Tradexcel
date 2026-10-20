-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "historicalDates" DATE[],
ADD COLUMN     "historicalStartDate" DATE;

-- "symbols" is added by the next migration (20260707210000), so on a database
-- built from scratch this column does not exist yet and a plain ALTER COLUMN
-- fails. Tolerate that here; the default is dropped again at the end of the
-- history so the final schema matches schema.prisma either way.
DO $$ BEGIN
  ALTER TABLE "Contest" ALTER COLUMN "symbols" DROP DEFAULT;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

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
