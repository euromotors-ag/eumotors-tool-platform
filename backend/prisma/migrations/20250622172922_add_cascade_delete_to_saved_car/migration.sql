-- DropForeignKey
ALTER TABLE "SavedCar" DROP CONSTRAINT "SavedCar_carId_fkey";

-- AddForeignKey
ALTER TABLE "SavedCar" ADD CONSTRAINT "SavedCar_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
