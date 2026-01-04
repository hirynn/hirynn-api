-- CreateEnum
CREATE TYPE "ContactReason" AS ENUM ('ORGANIZATION_SUPPORT', 'EDUCATOR_SUPPORT', 'TECHNICAL_ISSUE', 'FEEDBACK_OR_SUGGESTION', 'OTHER');

-- CreateTable
CREATE TABLE "contact_queries" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "reason" "ContactReason" NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_queries_pkey" PRIMARY KEY ("id")
);
