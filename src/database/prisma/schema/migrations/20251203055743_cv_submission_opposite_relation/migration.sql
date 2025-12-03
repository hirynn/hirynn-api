/*
  Warnings:

  - Added the required column `school_id` to the `cvsubmission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cvsubmission" ADD COLUMN     "school_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "cvsubmission" ADD CONSTRAINT "cvsubmission_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
