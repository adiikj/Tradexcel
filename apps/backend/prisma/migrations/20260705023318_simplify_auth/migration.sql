-- DropIndex
DROP INDEX "User_phoneNumber_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "countryCode",
DROP COLUMN "phoneNumber",
ADD COLUMN     "googleId" TEXT,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "dob" DROP NOT NULL,
ALTER COLUMN "pin" DROP NOT NULL;

-- DropTable
DROP TABLE "PendingUser";

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

