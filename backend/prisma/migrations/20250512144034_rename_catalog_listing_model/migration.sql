/*
  Warnings:

  - You are about to drop the `CartradeListing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CatalogListingdeCH` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CartradeListing" DROP CONSTRAINT "CartradeListing_carId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogListingdeCH" DROP CONSTRAINT "CatalogListingdeCH_carId_fkey";

-- DropTable
DROP TABLE "CartradeListing";

-- DropTable
DROP TABLE "CatalogListingdeCH";

-- CreateTable
CREATE TABLE "CatalogListing" (
    "title" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "comparison_link" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "comparison_price_chf" INTEGER NOT NULL,
    "price_chf" INTEGER NOT NULL,
    "image_urls" TEXT[],

    CONSTRAINT "CatalogListing_pkey" PRIMARY KEY ("carId")
);

-- AddForeignKey
ALTER TABLE "CatalogListing" ADD CONSTRAINT "CatalogListing_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
