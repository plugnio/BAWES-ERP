-- CreateTable
CREATE TABLE "Bank" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "ibanCode" TEXT NOT NULL,
    "swiftCode" TEXT NOT NULL,
    "codeAbk" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "transferType" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Bank_pkey" PRIMARY KEY ("id")
);
