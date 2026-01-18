-- AlterTable
ALTER TABLE "BatchOffer" ADD COLUMN     "comparison_link" TEXT,
ADD COLUMN     "comparison_price_chf" INTEGER,
ADD COLUMN     "comparison_text" TEXT,
ADD COLUMN     "modified_price_chf" INTEGER,
ADD COLUMN     "price_chf" INTEGER,
ADD COLUMN     "seats" INTEGER,
ADD COLUMN     "trim" TEXT;

-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "trim" TEXT;
