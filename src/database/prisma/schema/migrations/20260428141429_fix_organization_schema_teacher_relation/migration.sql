/*
  Warnings:

  - Added the required column `teacherId` to the `organizations` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "organizations_school_admin_id_idx";

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "teacherId" TEXT NOT NULL,
ALTER COLUMN "school_admin_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "organizations_teacherId_idx" ON "organizations"("teacherId");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
