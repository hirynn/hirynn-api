/*
  Warnings:

  - A unique constraint covering the columns `[directory_school_id]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "directory_school_id" TEXT;

-- CreateTable
CREATE TABLE "directory_connection_requests" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "directory_school_id" TEXT NOT NULL,
    "directory_school_name" TEXT,
    "directory_school_logo" TEXT,
    "requested_by_name" TEXT,
    "requested_by_email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "organization_id" TEXT,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "directory_connection_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "directory_connection_requests_code_key" ON "directory_connection_requests"("code");

-- CreateIndex
CREATE INDEX "directory_connection_requests_directory_school_id_idx" ON "directory_connection_requests"("directory_school_id");

-- CreateIndex
CREATE INDEX "directory_connection_requests_status_idx" ON "directory_connection_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_directory_school_id_key" ON "organizations"("directory_school_id");
