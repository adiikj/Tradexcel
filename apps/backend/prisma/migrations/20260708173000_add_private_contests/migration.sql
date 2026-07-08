-- CreateEnum
CREATE TYPE "ContestVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "Contest"
ADD COLUMN "visibility" "ContestVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "inviteCode" TEXT,
ADD COLUMN "ownerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Contest_inviteCode_key" ON "Contest"("inviteCode");
CREATE INDEX "Contest_visibility_startAt_idx" ON "Contest"("visibility", "startAt");
CREATE INDEX "Contest_ownerId_idx" ON "Contest"("ownerId");

-- AddForeignKey
ALTER TABLE "Contest" ADD CONSTRAINT "Contest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
