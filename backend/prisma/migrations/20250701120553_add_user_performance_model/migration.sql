-- CreateTable
CREATE TABLE "UserPerformance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "savedCarId" UUID NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soldPrice" DOUBLE PRECISION NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPerformance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserPerformance" ADD CONSTRAINT "UserPerformance_savedCarId_fkey" FOREIGN KEY ("savedCarId") REFERENCES "SavedCar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
