-- CreateTable
CREATE TABLE "cvsubmission" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "resume_url" TEXT,
    "years_experience" INTEGER,
    "expected_salary" INTEGER,
    "location" TEXT,
    "currentCompany" TEXT,
    "cover_letter" TEXT,
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "portfolioLink" TEXT,

    CONSTRAINT "cvsubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cvsubmission_applied_at_idx" ON "cvsubmission"("applied_at");
