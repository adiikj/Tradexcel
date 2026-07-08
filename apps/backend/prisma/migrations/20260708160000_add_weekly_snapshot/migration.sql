-- CreateTable
CREATE TABLE "WeeklySnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "startBalance" DECIMAL(18,2) NOT NULL,
    "endNetWorth" DECIMAL(18,2) NOT NULL,
    "pnlPercent" DECIMAL(10,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeeklySnapshot_userId_weekStart_idx" ON "WeeklySnapshot"("userId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklySnapshot_userId_weekStart_key" ON "WeeklySnapshot"("userId", "weekStart");

-- AddForeignKey
ALTER TABLE "WeeklySnapshot" ADD CONSTRAINT "WeeklySnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
