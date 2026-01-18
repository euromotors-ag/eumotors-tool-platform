/*
  Warnings:

  - You are about to drop the column `description` on the `BatchOffer` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerUnit` on the `BatchOffer` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `BatchOffer` table. All the data in the column will be lost.
  - You are about to drop the column `validUntil` on the `BatchOffer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BatchOffer" DROP COLUMN "description",
DROP COLUMN "pricePerUnit",
DROP COLUMN "title",
DROP COLUMN "validUntil",
ADD COLUMN     "color_exterior" TEXT,
ADD COLUMN     "color_interior" TEXT,
ADD COLUMN     "comparison_price" INTEGER,
ADD COLUMN     "first_reg_day" INTEGER,
ADD COLUMN     "first_reg_month" INTEGER,
ADD COLUMN     "first_reg_year" INTEGER,
ADD COLUMN     "price" INTEGER,
ADD COLUMN     "price_modified" INTEGER,
ADD COLUMN     "qty_available" INTEGER,
ADD COLUMN     "qty_order_max" INTEGER,
ADD COLUMN     "qty_order_min" INTEGER DEFAULT 1,
ADD COLUMN     "qty_total" INTEGER,
ADD COLUMN     "trans_type" TEXT,
ADD COLUMN     "valid_from" TIMESTAMP(3);
