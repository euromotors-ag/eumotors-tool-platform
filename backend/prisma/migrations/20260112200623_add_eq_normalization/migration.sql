/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Equipment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "code" VARCHAR(100);

-- CreateTable
CREATE TABLE "EquipmentMapping" (
    "id" TEXT NOT NULL,
    "sourceSystem" VARCHAR(100) NOT NULL,
    "rawValue" VARCHAR(255) NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(255),

    CONSTRAINT "EquipmentMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EquipmentMapping_sourceSystem_idx" ON "EquipmentMapping"("sourceSystem");

-- CreateIndex
CREATE INDEX "EquipmentMapping_rawValue_idx" ON "EquipmentMapping"("rawValue");

-- CreateIndex
CREATE INDEX "EquipmentMapping_equipment_id_idx" ON "EquipmentMapping"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentMapping_sourceSystem_rawValue_key" ON "EquipmentMapping"("sourceSystem", "rawValue");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_code_key" ON "Equipment"("code");

-- CreateIndex
CREATE INDEX "Equipment_code_idx" ON "Equipment"("code");

-- AddForeignKey
ALTER TABLE "EquipmentMapping" ADD CONSTRAINT "EquipmentMapping_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
