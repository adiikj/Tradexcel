-- AlterTable: fixed stock universe per contest
ALTER TABLE "Contest" ADD COLUMN "symbols" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable: replace joinNetWorth (main-portfolio snapshot) with an isolated
-- contest-scoped cash balance, seeded from the existing snapshot for any rows
-- that predate this migration (there is no better source for old rows).
ALTER TABLE "ContestEntry" ADD COLUMN "balance" DECIMAL(18,2);
UPDATE "ContestEntry" SET "balance" = "joinNetWorth" WHERE "balance" IS NULL;
ALTER TABLE "ContestEntry" ALTER COLUMN "balance" SET NOT NULL;
ALTER TABLE "ContestEntry" DROP COLUMN "joinNetWorth";

-- CreateTable
CREATE TABLE "ContestHolding" (
    "id" TEXT NOT NULL,
    "contestEntryId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "avgBuyPrice" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContestHolding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContestHolding_contestEntryId_symbol_key" ON "ContestHolding"("contestEntryId", "symbol");

-- AddForeignKey
ALTER TABLE "ContestHolding" ADD CONSTRAINT "ContestHolding_contestEntryId_fkey" FOREIGN KEY ("contestEntryId") REFERENCES "ContestEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ContestTransaction" (
    "id" TEXT NOT NULL,
    "contestEntryId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" "Side" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(18,4) NOT NULL,
    "total" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContestTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ContestTransaction" ADD CONSTRAINT "ContestTransaction_contestEntryId_fkey" FOREIGN KEY ("contestEntryId") REFERENCES "ContestEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
