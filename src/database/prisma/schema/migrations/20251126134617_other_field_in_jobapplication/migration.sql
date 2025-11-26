/*
  Warnings:

  - Added the required column `email` to the `job_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `full_name` to the `job_applications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "job_applications" ADD COLUMN     "currentCompany" TEXT,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "expected_salary" INTEGER,
ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "portfolioLink" TEXT,
ADD COLUMN     "resume_url" TEXT,
ADD COLUMN     "years_experience" INTEGER;
