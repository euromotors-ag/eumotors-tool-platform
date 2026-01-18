/*
  Warnings:

  - You are about to drop the `car_enums` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `car_equipment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `equipment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "car_equipment" DROP CONSTRAINT "car_equipment_car_id_fkey";

-- DropForeignKey
ALTER TABLE "car_equipment" DROP CONSTRAINT "car_equipment_equipment_id_fkey";

-- DropTable
DROP TABLE "car_enums";

-- DropTable
DROP TABLE "car_equipment";

-- DropTable
DROP TABLE "equipment";

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "binCategory" "EquipmentBin" NOT NULL,
    "category" VARCHAR(100),
    "source" VARCHAR(50) DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(255),

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarEquipment" (
    "id" TEXT NOT NULL,
    "car_id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarEnum" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "enumType" "CarEnumType" NOT NULL,
    "parentId" VARCHAR(255),
    "source" VARCHAR(50) DEFAULT 'enum',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarEnum_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_name_key" ON "Equipment"("name");

-- CreateIndex
CREATE INDEX "Equipment_name_idx" ON "Equipment"("name");

-- CreateIndex
CREATE INDEX "Equipment_binCategory_idx" ON "Equipment"("binCategory");

-- CreateIndex
CREATE INDEX "Equipment_category_idx" ON "Equipment"("category");

-- CreateIndex
CREATE INDEX "CarEquipment_car_id_idx" ON "CarEquipment"("car_id");

-- CreateIndex
CREATE INDEX "CarEquipment_equipment_id_idx" ON "CarEquipment"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "CarEquipment_car_id_equipment_id_key" ON "CarEquipment"("car_id", "equipment_id");

-- CreateIndex
CREATE INDEX "CarEnum_enumType_idx" ON "CarEnum"("enumType");

-- CreateIndex
CREATE INDEX "CarEnum_parentId_idx" ON "CarEnum"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "CarEnum_name_enumType_parentId_key" ON "CarEnum"("name", "enumType", "parentId");

-- AddForeignKey
ALTER TABLE "CarEquipment" ADD CONSTRAINT "CarEquipment_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarEquipment" ADD CONSTRAINT "CarEquipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
