-- CreateEnum
CREATE TYPE "QueuedOrderStatus" AS ENUM ('PENDING', 'FILLED', 'CANCELLED', 'FAILED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ORDER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "resetCodeExpiry" TIMESTAMP(3),
ADD COLUMN     "resetCodeHash" TEXT,
ADD COLUMN     "resetRequestedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "QueuedOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" "Side" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quotedPrice" DECIMAL(18,4) NOT NULL,
    "status" "QueuedOrderStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "transactionId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueuedOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QueuedOrder_transactionId_key" ON "QueuedOrder"("transactionId");

-- CreateIndex
CREATE INDEX "QueuedOrder_status_createdAt_idx" ON "QueuedOrder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "QueuedOrder_userId_status_idx" ON "QueuedOrder"("userId", "status");

-- AddForeignKey
ALTER TABLE "QueuedOrder" ADD CONSTRAINT "QueuedOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Same backstop as the ledger tables: an order is always for at least one share.
ALTER TABLE "QueuedOrder" ADD CONSTRAINT "QueuedOrder_quantity_positive" CHECK ("quantity" > 0);
