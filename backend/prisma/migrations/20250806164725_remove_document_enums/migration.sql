/*
  Warnings:

  - The `documentStatus` column on the `OrderDocument` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `documentType` on the `OrderDocument` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "OrderDocument" DROP COLUMN "documentType",
ADD COLUMN     "documentType" TEXT NOT NULL,
DROP COLUMN "documentStatus",
ADD COLUMN     "documentStatus" TEXT NOT NULL DEFAULT 'PENDING_SIGNATURE';

-- DropEnum
DROP TYPE "DocumentStatus";

-- DropEnum
DROP TYPE "DocumentType";

-- CreateIndex
CREATE INDEX "OrderDocument_documentType_idx" ON "OrderDocument"("documentType");

-- CreateIndex
CREATE INDEX "OrderDocument_documentStatus_idx" ON "OrderDocument"("documentStatus");
