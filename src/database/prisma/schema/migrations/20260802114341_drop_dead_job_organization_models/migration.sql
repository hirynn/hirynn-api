/*
  Warnings:

  - You are about to drop the `JobOrganization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrganizationApplication` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrganizationApplication" DROP CONSTRAINT "OrganizationApplication_jobId_fkey";

-- DropTable
DROP TABLE "JobOrganization";

-- DropTable
DROP TABLE "OrganizationApplication";
