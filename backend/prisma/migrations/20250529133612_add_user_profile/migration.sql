-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" UUID NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "jobTitle" TEXT,
    "phoneNumber" TEXT,
    "profileImage" TEXT,
    "website" TEXT,
    "companyName" TEXT,
    "companyType" TEXT,
    "vatNumber" TEXT,
    "language" TEXT,
    "country" TEXT,
    "city" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "logoUrl" TEXT,
    "dealerNumber" TEXT,
    "businessLicense" TEXT,
    "invoiceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
