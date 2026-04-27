/*
  Warnings:

  - You are about to drop the column `description` on the `jobs` table. All the data in the column will be lost.
  - Added the required column `jobDescription` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keyResponsibilities` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `preferredSkills` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workplace_type` to the `jobs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "jobs" DROP COLUMN "description",
ADD COLUMN     "jobDescription" TEXT NOT NULL,
ADD COLUMN     "keyResponsibilities" TEXT NOT NULL,
ADD COLUMN     "preferredSkills" TEXT NOT NULL,
ADD COLUMN     "workplace_type" "WorkplaceType" NOT NULL,
ALTER COLUMN "location" DROP NOT NULL;
