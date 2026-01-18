/*
  Warnings:

  - You are about to drop the column `availableQuantity` on the `BatchOffer` table. All the data in the column will be lost.
  - You are about to drop the column `comparison_price_chf` on the `BatchOffer` table. All the data in the column will be lost.
  - You are about to drop the column `exterior_color` on the `BatchOffer` table. All the data in the column will be lost.
  - You are about to drop the column `first_registration_day` on the `BatchOffer` table. All the data in the column will be lost.
  - You are about to drop the column `first_registration_month` on the `BatchOffer` table. All the data in the column will be lost.
  - You are about to drop the column `first_registration_year` on the `BatchOffer` table. All the data in the column will be lost.
  - You are about to drop the column `interior_color` on the `BatchOffer` table. All the data in the column will be lost.
  - You are about to drop the column `maximumOrderQuantity` on the `BatchOffer` table. All the data in the column will be lost.
  - You are about to drop the column `minimumOrderQuantity` on the `BatchOffer` table. All the data in the column will be lost.
  - You are about to drop the column `modified_price_chf` on the `BatchOffer` table. All the data in the column will be lost.
  - You are about to drop the column `price_chf` on the `BatchOffer` table. All the data in the column will be lost.
  - You are about to drop the column `totalQuantity` on the `BatchOffer` table. All the data in the column will be lost.
  - You are about to drop the column `transmission_type` on the `BatchOffer` table. All the data in the column will be lost.
  - You are about to drop the column `validFrom` on the `BatchOffer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BatchOffer" DROP COLUMN "availableQuantity",
DROP COLUMN "comparison_price_chf",
DROP COLUMN "exterior_color",
DROP COLUMN "first_registration_day",
DROP COLUMN "first_registration_month",
DROP COLUMN "first_registration_year",
DROP COLUMN "interior_color",
DROP COLUMN "maximumOrderQuantity",
DROP COLUMN "minimumOrderQuantity",
DROP COLUMN "modified_price_chf",
DROP COLUMN "price_chf",
DROP COLUMN "totalQuantity",
DROP COLUMN "transmission_type",
DROP COLUMN "validFrom",
ADD COLUMN     "drive_type" TEXT;
