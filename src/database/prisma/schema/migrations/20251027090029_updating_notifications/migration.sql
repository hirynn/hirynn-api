/*
  Warnings:

  - You are about to drop the column `user_id` on the `notifications` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_school_admin_user_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_teacher_user_id_fkey";

-- DropIndex
DROP INDEX "notifications_user_id_idx";

-- DropIndex
DROP INDEX "notifications_user_id_is_read_created_at_idx";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "user_id",
ADD COLUMN     "school_admin_id" TEXT,
ADD COLUMN     "teacher_id" TEXT;

-- CreateIndex
CREATE INDEX "notifications_teacher_id_idx" ON "notifications"("teacher_id");

-- CreateIndex
CREATE INDEX "notifications_teacher_id_is_read_created_at_school_admin_id_idx" ON "notifications"("teacher_id", "is_read", "created_at", "school_admin_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_teacher_user_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_school_admin_user_id_fkey" FOREIGN KEY ("school_admin_id") REFERENCES "school_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
