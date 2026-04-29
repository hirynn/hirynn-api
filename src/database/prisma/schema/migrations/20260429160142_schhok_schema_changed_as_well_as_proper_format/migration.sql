/*
  Warnings:

  - You are about to drop the column `school_admin_id` on the `organizations` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SchoolType" AS ENUM ('PUBLIC', 'PRIVATE');

-- DropForeignKey
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_school_admin_id_fkey";

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "school_admin_id",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "schoolAdminId" TEXT,
ADD COLUMN     "type" "SchoolType" NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "job_posters" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_posters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_posters_organization_id_idx" ON "job_posters"("organization_id");

-- AddForeignKey
ALTER TABLE "job_posters" ADD CONSTRAINT "job_posters_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_schoolAdminId_fkey" FOREIGN KEY ("schoolAdminId") REFERENCES "school_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
