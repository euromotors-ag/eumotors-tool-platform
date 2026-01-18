-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "refreshToken" TEXT,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL,
    "vin" TEXT,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "fuel_type" TEXT,
    "body_type" TEXT,
    "drive_type" TEXT,
    "transmission_type" TEXT,
    "exterior_color" TEXT,
    "interior_color" TEXT,
    "energy_efficiency" TEXT,
    "euro_norm" TEXT,
    "equipment" TEXT[],
    "seats" INTEGER NOT NULL,
    "doors" INTEGER NOT NULL,
    "cylinders" INTEGER NOT NULL,
    "power_hp" INTEGER NOT NULL,
    "mileage_km" INTEGER NOT NULL,
    "cubic_capacity_cm3" INTEGER NOT NULL,
    "empty_weight_kg" INTEGER NOT NULL,
    "co2_emission_g_km" DOUBLE PRECISION NOT NULL,
    "fuel_consumption_l_100km" DOUBLE PRECISION NOT NULL,
    "first_registration_year" INTEGER NOT NULL,
    "first_registration_month" INTEGER NOT NULL,
    "first_registration_day" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "original_link" TEXT NOT NULL,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartradeListing" (
    "title" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "comparison_link" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "b2b_price_chf" INTEGER,
    "b2c_price_chf" INTEGER,
    "comparison_price_chf" INTEGER NOT NULL,
    "image_urls" TEXT[],

    CONSTRAINT "CartradeListing_pkey" PRIMARY KEY ("carId")
);

-- CreateTable
CREATE TABLE "CatalogListingdeCH" (
    "title" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "comparison_link" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "comparison_price_chf" INTEGER NOT NULL,
    "price_chf" INTEGER NOT NULL,
    "image_urls" TEXT[],

    CONSTRAINT "CatalogListingdeCH_pkey" PRIMARY KEY ("carId")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company" TEXT,
    "message" TEXT NOT NULL,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "CartradeListing" ADD CONSTRAINT "CartradeListing_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogListingdeCH" ADD CONSTRAINT "CatalogListingdeCH_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
