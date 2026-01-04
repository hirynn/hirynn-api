-- CreateEnum
CREATE TYPE "LisenceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "lisences" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "lisence_number" TEXT,
    "issuing_organization" TEXT,
    "document_url" TEXT NOT NULL,
    "status" "LisenceStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "verified_by" TEXT,
    "verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "lisences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lisences_teacher_id_key" ON "lisences"("teacher_id");

-- CreateIndex
CREATE INDEX "lisences_teacher_id_idx" ON "lisences"("teacher_id");

-- CreateIndex
CREATE INDEX "lisences_status_idx" ON "lisences"("status");

-- AddForeignKey
ALTER TABLE "lisences" ADD CONSTRAINT "lisences_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
