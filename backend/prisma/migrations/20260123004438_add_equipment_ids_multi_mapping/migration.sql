-- AlterTable
ALTER TABLE "EquipmentMapping" ADD COLUMN     "equipmentIds" JSONB,
ALTER COLUMN "equipment_id" DROP NOT NULL;
