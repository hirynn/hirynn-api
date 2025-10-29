/*
  Warnings:

  - You are about to drop the column `reported_user_id` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `reporter_id` on the `reports` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_reported_school_admin_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_reported_teacher_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_reporter_school_admin_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_reporter_teacher_fkey";

-- DropIndex
DROP INDEX "reports_reported_user_id_idx";

-- DropIndex
DROP INDEX "reports_reporter_id_idx";

-- AlterTable
ALTER TABLE "reports" DROP COLUMN "reported_user_id",
DROP COLUMN "reporter_id",
ADD COLUMN     "reportedSchoolAdminId" TEXT,
ADD COLUMN     "reportedTeacherId" TEXT,
ADD COLUMN     "reporterSchoolAdminId" TEXT,
ADD COLUMN     "reporterTeacherId" TEXT;

-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "resumeUrl" TEXT;

-- CreateIndex
CREATE INDEX "reports_reporterTeacherId_idx" ON "reports"("reporterTeacherId");

-- CreateIndex
CREATE INDEX "reports_reporterSchoolAdminId_idx" ON "reports"("reporterSchoolAdminId");

-- CreateIndex
CREATE INDEX "reports_reportedSchoolAdminId_idx" ON "reports"("reportedSchoolAdminId");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_teacher_fkey" FOREIGN KEY ("reporterTeacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_school_admin_fkey" FOREIGN KEY ("reporterSchoolAdminId") REFERENCES "school_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_teacher_fkey" FOREIGN KEY ("reportedTeacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_school_admin_fkey" FOREIGN KEY ("reportedSchoolAdminId") REFERENCES "school_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
