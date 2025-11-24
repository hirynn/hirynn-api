/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `JobOrganization` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationName` to the `JobOrganization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `JobOrganization` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JobOrganization" ADD COLUMN     "organizationName" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "JobOrganization_slug_key" ON "JobOrganization"("slug");
