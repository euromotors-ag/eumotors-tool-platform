-- CreateEnum
CREATE TYPE "EquipmentBin" AS ENUM ('bin_good', 'bin_trash');

-- CreateEnum
CREATE TYPE "CarEnumType" AS ENUM ('body_type', 'fuel_type', 'drive_type', 'transmission_type', 'color', 'interior_material', 'brand', 'model', 'energy_efficiency', 'euro_norm', 'currency');

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "binCategory" "EquipmentBin" NOT NULL,
    "category" VARCHAR(100),
    "source" VARCHAR(50) DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(255),

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_equipment" (
    "id" TEXT NOT NULL,
    "car_id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_enums" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "enumType" "CarEnumType" NOT NULL,
    "parentId" VARCHAR(255),
    "source" VARCHAR(50) DEFAULT 'enum',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "car_enums_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "equipment_name_key" ON "equipment"("name");

-- CreateIndex
CREATE INDEX "equipment_name_idx" ON "equipment"("name");

-- CreateIndex
CREATE INDEX "equipment_binCategory_idx" ON "equipment"("binCategory");

-- CreateIndex
CREATE INDEX "equipment_category_idx" ON "equipment"("category");

-- CreateIndex
CREATE INDEX "car_equipment_car_id_idx" ON "car_equipment"("car_id");

-- CreateIndex
CREATE INDEX "car_equipment_equipment_id_idx" ON "car_equipment"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "car_equipment_car_id_equipment_id_key" ON "car_equipment"("car_id", "equipment_id");

-- CreateIndex
CREATE INDEX "car_enums_enumType_idx" ON "car_enums"("enumType");

-- CreateIndex
CREATE INDEX "car_enums_parentId_idx" ON "car_enums"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "car_enums_name_enumType_parentId_key" ON "car_enums"("name", "enumType", "parentId");

-- AddForeignKey
ALTER TABLE "car_equipment" ADD CONSTRAINT "car_equipment_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_equipment" ADD CONSTRAINT "car_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
