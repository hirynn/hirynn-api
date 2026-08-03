-- CreateEnum
CREATE TYPE "UploadFolder" AS ENUM ('PROFILE_PHOTOS', 'RESUMES', 'LISENCES', 'ORGANIZATION_LOGOS', 'ORGANIZATION_BANNERS', 'ANONYMOUS_RESUMES', 'CV_SUBMISSIONS', 'MISC');

-- CreateTable
CREATE TABLE "file_uploads" (
    "id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "stored_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "folder" "UploadFolder" NOT NULL,
    "relative_path" TEXT NOT NULL,
    "uploaded_by_id" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "trash_path" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "file_uploads_uploaded_by_id_idx" ON "file_uploads"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "file_uploads_folder_idx" ON "file_uploads"("folder");

-- CreateIndex
CREATE INDEX "file_uploads_is_deleted_idx" ON "file_uploads"("is_deleted");

-- CreateIndex
CREATE INDEX "file_uploads_created_at_idx" ON "file_uploads"("created_at");
