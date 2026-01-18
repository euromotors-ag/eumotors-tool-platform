-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DOCUMENT_READONLY', 'DOCUMENT_SIGN', 'DOCUMENT_SIGNED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING_SIGNATURE', 'SIGNED', 'COMPLETED');

-- CreateTable
CREATE TABLE "OrderDocument" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "documentStatus" "DocumentStatus" NOT NULL DEFAULT 'PENDING_SIGNATURE',
    "uploadedBy" UUID NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedAt" TIMESTAMP(3),
    "notes" TEXT,
    "originalDocumentId" UUID,

    CONSTRAINT "OrderDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderDocument_orderId_idx" ON "OrderDocument"("orderId");

-- CreateIndex
CREATE INDEX "OrderDocument_uploadedBy_idx" ON "OrderDocument"("uploadedBy");

-- CreateIndex
CREATE INDEX "OrderDocument_documentType_idx" ON "OrderDocument"("documentType");

-- CreateIndex
CREATE INDEX "OrderDocument_documentStatus_idx" ON "OrderDocument"("documentStatus");

-- AddForeignKey
ALTER TABLE "OrderDocument" ADD CONSTRAINT "OrderDocument_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "GarageItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDocument" ADD CONSTRAINT "OrderDocument_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDocument" ADD CONSTRAINT "OrderDocument_originalDocumentId_fkey" FOREIGN KEY ("originalDocumentId") REFERENCES "OrderDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
