/*
  Warnings:

  - You are about to drop the `schools` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "cvsubmission" DROP CONSTRAINT "cvsubmission_school_id_fkey";

-- DropForeignKey
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_school_id_fkey";

-- DropForeignKey
ALTER TABLE "schools" DROP CONSTRAINT "schools_school_admin_id_fkey";

-- DropTable
DROP TABLE "schools";

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "school_admin_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "logo_url" VARCHAR(500),
    "banner_url" VARCHAR(500),
    "about" TEXT,
    "vision" TEXT,
    "address" VARCHAR(500),
    "phone" VARCHAR(20),
    "website" VARCHAR(200),
    "contact_email" VARCHAR(255),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organizations_school_admin_id_idx" ON "organizations"("school_admin_id");

-- CreateIndex
CREATE INDEX "organizations_name_idx" ON "organizations"("name");

-- CreateIndex
CREATE INDEX "organizations_is_verified_idx" ON "organizations"("is_verified");

-- CreateIndex
CREATE INDEX "organizations_created_at_idx" ON "organizations"("created_at");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cvsubmission" ADD CONSTRAINT "cvsubmission_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_school_admin_id_fkey" FOREIGN KEY ("school_admin_id") REFERENCES "school_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
