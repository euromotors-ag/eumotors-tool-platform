/*
  Warnings:

  - You are about to drop the column `ai_description` on the `CatalogListing` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CatalogListing" DROP COLUMN "ai_description",
ADD COLUMN     "ai_description_b2b" TEXT,
ADD COLUMN     "ai_description_b2c" TEXT;
