-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'HIDDEN');

-- AlterTable
ALTER TABLE "CatalogListing" ADD COLUMN     "market" TEXT NOT NULL DEFAULT 'CH',
ADD COLUMN     "reservedById" UUID,
ADD COLUMN     "reservedUntil" TIMESTAMP(3),
ADD COLUMN     "status" "ListingStatus" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "SavedCar" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "orderStatus" "OrderStatus";

-- AddForeignKey
ALTER TABLE "CatalogListing" ADD CONSTRAINT "CatalogListing_reservedById_fkey" FOREIGN KEY ("reservedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
