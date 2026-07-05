-- CreateEnum
CREATE TYPE "AlertDirection" AS ENUM ('ABOVE', 'BELOW');

-- CreateTable
CREATE TABLE "PriceAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "targetPrice" DECIMAL(18,4) NOT NULL,
    "direction" "AlertDirection" NOT NULL,
    "triggered" BOOLEAN NOT NULL DEFAULT false,
    "triggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

