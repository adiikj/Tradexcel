-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('MARKET', 'LIMIT', 'STOP');

-- AlterTable
ALTER TABLE "QueuedOrder" ADD COLUMN     "orderType" "OrderType" NOT NULL DEFAULT 'MARKET',
ADD COLUMN     "triggerPrice" DECIMAL(18,4);

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "charges" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- Limit and stop orders always carry a positive trigger price; market orders never do.
ALTER TABLE "QueuedOrder" ADD CONSTRAINT "QueuedOrder_trigger_price_matches_type"
  CHECK (("orderType" = 'MARKET') = ("triggerPrice" IS NULL) AND ("triggerPrice" IS NULL OR "triggerPrice" > 0));
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_charges_non_negative" CHECK ("charges" >= 0);
