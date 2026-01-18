-- AlterTable
ALTER TABLE "ShareToken" ADD COLUMN     "batchOfferId" TEXT,
ADD COLUMN     "entityType" TEXT NOT NULL DEFAULT 'car',
ALTER COLUMN "carId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ShareToken_batchOfferId_idx" ON "ShareToken"("batchOfferId");
