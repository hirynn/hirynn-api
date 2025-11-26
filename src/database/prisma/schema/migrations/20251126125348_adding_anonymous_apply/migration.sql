-- CreateTable
CREATE TABLE "job_applications_anonymous" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "resume_url" TEXT,
    "years_experience" INTEGER,
    "expected_salary" INTEGER,
    "location" TEXT,
    "cover_letter" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_applications_anonymous_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_applications_anonymous_job_id_idx" ON "job_applications_anonymous"("job_id");

-- CreateIndex
CREATE INDEX "job_applications_anonymous_status_idx" ON "job_applications_anonymous"("status");

-- CreateIndex
CREATE INDEX "job_applications_anonymous_applied_at_idx" ON "job_applications_anonymous"("applied_at");

-- AddForeignKey
ALTER TABLE "job_applications_anonymous" ADD CONSTRAINT "job_applications_anonymous_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
