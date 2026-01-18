-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('FAVORITE', 'RESERVED', 'PURCHASED');

-- CreateEnum
CREATE TYPE "BatchOfferStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED', 'SOLD_OUT');

-- CreateTable
CREATE TABLE "GarageItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "garageId" UUID NOT NULL,
    "itemStatus" "ItemStatus" NOT NULL DEFAULT 'FAVORITE',
    "orderStatus" "OrderStatus",
    "expiresAt" TIMESTAMP(3),
    "orderQuantity" INTEGER,
    "orderTotalPrice" INTEGER,
    "orderNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "carId" TEXT,
    "batchOfferId" TEXT,

    CONSTRAINT "GarageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchOffer" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "supplier" TEXT NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "pricePerUnit" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CHF',
    "minimumOrderQuantity" INTEGER DEFAULT 1,
    "maximumOrderQuantity" INTEGER,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "status" "BatchOfferStatus" NOT NULL DEFAULT 'ACTIVE',
    "market" TEXT NOT NULL DEFAULT 'CH',
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "fuel_type" TEXT,
    "body_type" TEXT,
    "transmission_type" TEXT,
    "mileage_km" INTEGER,
    "power_hp" INTEGER,
    "cubic_capacity_cm3" INTEGER NOT NULL,
    "empty_weight_kg" INTEGER NOT NULL,
    "co2_emission_g_km" DOUBLE PRECISION NOT NULL,
    "exterior_color" TEXT,
    "interior_color" TEXT,
    "first_registration_year" INTEGER NOT NULL,
    "first_registration_month" INTEGER NOT NULL,
    "first_registration_day" INTEGER,
    "equipment" TEXT[],
    "image_urls" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GarageItem_garageId_carId_itemStatus_key" ON "GarageItem"("garageId", "carId", "itemStatus");

-- CreateIndex
CREATE UNIQUE INDEX "GarageItem_garageId_batchOfferId_itemStatus_key" ON "GarageItem"("garageId", "batchOfferId", "itemStatus");

-- AddForeignKey
ALTER TABLE "GarageItem" ADD CONSTRAINT "GarageItem_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GarageItem" ADD CONSTRAINT "GarageItem_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GarageItem" ADD CONSTRAINT "GarageItem_batchOfferId_fkey" FOREIGN KEY ("batchOfferId") REFERENCES "BatchOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
