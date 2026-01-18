/*
  Warnings:

  - You are about to drop the column `savedCarId` on the `UserPerformance` table. All the data in the column will be lost.
  - You are about to drop the `SavedCar` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `garageId` to the `UserPerformance` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SavedCar" DROP CONSTRAINT "SavedCar_carId_fkey";

-- DropForeignKey
ALTER TABLE "SavedCar" DROP CONSTRAINT "SavedCar_garageId_fkey";

-- DropForeignKey
ALTER TABLE "UserPerformance" DROP CONSTRAINT "UserPerformance_savedCarId_fkey";

-- AlterTable
ALTER TABLE "UserPerformance" DROP COLUMN "savedCarId",
ADD COLUMN     "garageId" UUID NOT NULL;

-- DropTable
DROP TABLE "SavedCar";

-- DropEnum
DROP TYPE "SaveType";

-- AddForeignKey
ALTER TABLE "UserPerformance" ADD CONSTRAINT "UserPerformance_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
