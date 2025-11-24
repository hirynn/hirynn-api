-- CreateTable
CREATE TABLE "JobOrganization" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "employmentType" "EmploymentType",
    "organizationId" TEXT NOT NULL,
    "createdByName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationApplication" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "currentCompany" TEXT,
    "yearsOfExperience" INTEGER,
    "location" TEXT,
    "linkedinUrl" TEXT,
    "portfolioLink" TEXT,
    "resumeUrl" TEXT,
    "coverLetter" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationApplication_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrganizationApplication" ADD CONSTRAINT "OrganizationApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
