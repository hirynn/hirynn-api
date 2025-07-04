-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'REJECTED', 'HIRED');

-- CreateEnum
CREATE TYPE "FollowType" AS ENUM ('TEACHER', 'SCHOOL');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'MODERATOR',
    "permissions" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "refreshToken" TEXT,
    "resetToken" TEXT,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "resource_id" TEXT,
    "details" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "subjects" TEXT[],
    "grade_levels" TEXT[],
    "experience_required" VARCHAR(100) NOT NULL,
    "location" VARCHAR(200) NOT NULL,
    "employment_type" "EmploymentType" NOT NULL,
    "salary_min" DECIMAL(10,2),
    "salary_max" DECIMAL(10,2),
    "requirements" TEXT,
    "benefits" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "application_deadline" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "cover_letter" TEXT,
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_jobs" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "saved_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_type" VARCHAR(20) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reporter_type" VARCHAR(20) NOT NULL,
    "reported_user_id" TEXT,
    "reported_user_type" VARCHAR(20),
    "reported_content_id" TEXT,
    "content_type" VARCHAR(50),
    "reason" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "handled_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_admins" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255),
    "google_id" TEXT,
    "linkedIn_id" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "refreshToken" TEXT,
    "resetToken" TEXT,

    CONSTRAINT "school_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
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

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "title" VARCHAR(300),
    "content" TEXT NOT NULL,
    "attachments" TEXT[],
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endorsements" (
    "id" TEXT NOT NULL,
    "endorser_id" TEXT NOT NULL,
    "endorsed_id" TEXT NOT NULL,
    "skill" VARCHAR(100) NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "endorsements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "follower_id" TEXT NOT NULL,
    "following_id" TEXT NOT NULL,
    "following_type" "FollowType" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255),
    "google_id" TEXT,
    "linkedIn_id" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "profile_photo_url" VARCHAR(500),
    "location" VARCHAR(200),
    "bio" TEXT,
    "subjects_taught" TEXT[],
    "grade_levels" TEXT[],
    "years_experience" SMALLINT NOT NULL DEFAULT 0,
    "current_school" VARCHAR(200),
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "refreshToken" TEXT,
    "resetToken" TEXT,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "degree" VARCHAR(200) NOT NULL,
    "institution" VARCHAR(200) NOT NULL,
    "field_of_study" VARCHAR(200) NOT NULL,
    "graduation_year" SMALLINT NOT NULL,
    "certificate_url" VARCHAR(500),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "issuing_organization" VARCHAR(200) NOT NULL,
    "issue_date" DATE NOT NULL,
    "expiry_date" DATE,
    "certificate_url" VARCHAR(500),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "file_url" VARCHAR(500) NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_videos" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "video_url" VARCHAR(500) NOT NULL,
    "thumbnail_url" VARCHAR(500),
    "duration_seconds" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "admins_email_idx" ON "admins"("email");

-- CreateIndex
CREATE INDEX "admins_role_idx" ON "admins"("role");

-- CreateIndex
CREATE INDEX "admins_is_active_idx" ON "admins"("is_active");

-- CreateIndex
CREATE INDEX "admins_created_at_idx" ON "admins"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_admin_id_idx" ON "audit_logs"("admin_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "jobs_school_id_idx" ON "jobs"("school_id");

-- CreateIndex
CREATE INDEX "jobs_title_idx" ON "jobs"("title");

-- CreateIndex
CREATE INDEX "jobs_subjects_idx" ON "jobs"("subjects");

-- CreateIndex
CREATE INDEX "jobs_grade_levels_idx" ON "jobs"("grade_levels");

-- CreateIndex
CREATE INDEX "jobs_location_idx" ON "jobs"("location");

-- CreateIndex
CREATE INDEX "jobs_employment_type_idx" ON "jobs"("employment_type");

-- CreateIndex
CREATE INDEX "jobs_salary_min_salary_max_idx" ON "jobs"("salary_min", "salary_max");

-- CreateIndex
CREATE INDEX "jobs_is_active_idx" ON "jobs"("is_active");

-- CreateIndex
CREATE INDEX "jobs_application_deadline_idx" ON "jobs"("application_deadline");

-- CreateIndex
CREATE INDEX "jobs_created_at_idx" ON "jobs"("created_at");

-- CreateIndex
CREATE INDEX "job_applications_job_id_idx" ON "job_applications"("job_id");

-- CreateIndex
CREATE INDEX "job_applications_teacher_id_idx" ON "job_applications"("teacher_id");

-- CreateIndex
CREATE INDEX "job_applications_status_idx" ON "job_applications"("status");

-- CreateIndex
CREATE INDEX "job_applications_applied_at_idx" ON "job_applications"("applied_at");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_job_id_teacher_id_key" ON "job_applications"("job_id", "teacher_id");

-- CreateIndex
CREATE INDEX "saved_jobs_teacher_id_idx" ON "saved_jobs"("teacher_id");

-- CreateIndex
CREATE INDEX "saved_jobs_job_id_idx" ON "saved_jobs"("job_id");

-- CreateIndex
CREATE INDEX "saved_jobs_saved_at_idx" ON "saved_jobs"("saved_at");

-- CreateIndex
CREATE UNIQUE INDEX "saved_jobs_teacher_id_job_id_key" ON "saved_jobs"("teacher_id", "job_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_type_idx" ON "notifications"("user_type");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "reports_reporter_id_idx" ON "reports"("reporter_id");

-- CreateIndex
CREATE INDEX "reports_reporter_type_idx" ON "reports"("reporter_type");

-- CreateIndex
CREATE INDEX "reports_reported_user_id_idx" ON "reports"("reported_user_id");

-- CreateIndex
CREATE INDEX "reports_reported_user_type_idx" ON "reports"("reported_user_type");

-- CreateIndex
CREATE INDEX "reports_content_type_idx" ON "reports"("content_type");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_handled_by_idx" ON "reports"("handled_by");

-- CreateIndex
CREATE INDEX "reports_created_at_idx" ON "reports"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "school_admins_email_key" ON "school_admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "school_admins_google_id_key" ON "school_admins"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "school_admins_linkedIn_id_key" ON "school_admins"("linkedIn_id");

-- CreateIndex
CREATE INDEX "school_admins_email_idx" ON "school_admins"("email");

-- CreateIndex
CREATE INDEX "school_admins_google_id_idx" ON "school_admins"("google_id");

-- CreateIndex
CREATE INDEX "school_admins_is_active_idx" ON "school_admins"("is_active");

-- CreateIndex
CREATE INDEX "school_admins_created_at_idx" ON "school_admins"("created_at");

-- CreateIndex
CREATE INDEX "schools_school_admin_id_idx" ON "schools"("school_admin_id");

-- CreateIndex
CREATE INDEX "schools_name_idx" ON "schools"("name");

-- CreateIndex
CREATE INDEX "schools_is_verified_idx" ON "schools"("is_verified");

-- CreateIndex
CREATE INDEX "schools_created_at_idx" ON "schools"("created_at");

-- CreateIndex
CREATE INDEX "posts_author_id_idx" ON "posts"("author_id");

-- CreateIndex
CREATE INDEX "posts_created_at_idx" ON "posts"("created_at");

-- CreateIndex
CREATE INDEX "posts_likes_count_idx" ON "posts"("likes_count");

-- CreateIndex
CREATE INDEX "posts_comments_count_idx" ON "posts"("comments_count");

-- CreateIndex
CREATE INDEX "comments_post_id_idx" ON "comments"("post_id");

-- CreateIndex
CREATE INDEX "comments_author_id_idx" ON "comments"("author_id");

-- CreateIndex
CREATE INDEX "comments_created_at_idx" ON "comments"("created_at");

-- CreateIndex
CREATE INDEX "likes_post_id_idx" ON "likes"("post_id");

-- CreateIndex
CREATE INDEX "likes_user_id_idx" ON "likes"("user_id");

-- CreateIndex
CREATE INDEX "likes_created_at_idx" ON "likes"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "likes_post_id_user_id_key" ON "likes"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "endorsements_endorser_id_idx" ON "endorsements"("endorser_id");

-- CreateIndex
CREATE INDEX "endorsements_endorsed_id_idx" ON "endorsements"("endorsed_id");

-- CreateIndex
CREATE INDEX "endorsements_skill_idx" ON "endorsements"("skill");

-- CreateIndex
CREATE INDEX "endorsements_created_at_idx" ON "endorsements"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "endorsements_endorser_id_endorsed_id_skill_key" ON "endorsements"("endorser_id", "endorsed_id", "skill");

-- CreateIndex
CREATE INDEX "follows_follower_id_idx" ON "follows"("follower_id");

-- CreateIndex
CREATE INDEX "follows_following_id_idx" ON "follows"("following_id");

-- CreateIndex
CREATE INDEX "follows_following_type_idx" ON "follows"("following_type");

-- CreateIndex
CREATE INDEX "follows_created_at_idx" ON "follows"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_id_following_id_following_type_key" ON "follows"("follower_id", "following_id", "following_type");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_email_key" ON "teachers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_google_id_key" ON "teachers"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_linkedIn_id_key" ON "teachers"("linkedIn_id");

-- CreateIndex
CREATE INDEX "teachers_email_idx" ON "teachers"("email");

-- CreateIndex
CREATE INDEX "teachers_google_id_idx" ON "teachers"("google_id");

-- CreateIndex
CREATE INDEX "teachers_name_idx" ON "teachers"("name");

-- CreateIndex
CREATE INDEX "teachers_location_idx" ON "teachers"("location");

-- CreateIndex
CREATE INDEX "teachers_subjects_taught_idx" ON "teachers"("subjects_taught");

-- CreateIndex
CREATE INDEX "teachers_grade_levels_idx" ON "teachers"("grade_levels");

-- CreateIndex
CREATE INDEX "teachers_years_experience_idx" ON "teachers"("years_experience");

-- CreateIndex
CREATE INDEX "teachers_is_premium_idx" ON "teachers"("is_premium");

-- CreateIndex
CREATE INDEX "teachers_is_active_idx" ON "teachers"("is_active");

-- CreateIndex
CREATE INDEX "teachers_created_at_idx" ON "teachers"("created_at");

-- CreateIndex
CREATE INDEX "education_teacher_id_idx" ON "education"("teacher_id");

-- CreateIndex
CREATE INDEX "education_graduation_year_idx" ON "education"("graduation_year");

-- CreateIndex
CREATE INDEX "education_is_verified_idx" ON "education"("is_verified");

-- CreateIndex
CREATE INDEX "certifications_teacher_id_idx" ON "certifications"("teacher_id");

-- CreateIndex
CREATE INDEX "certifications_issue_date_idx" ON "certifications"("issue_date");

-- CreateIndex
CREATE INDEX "certifications_expiry_date_idx" ON "certifications"("expiry_date");

-- CreateIndex
CREATE INDEX "certifications_is_verified_idx" ON "certifications"("is_verified");

-- CreateIndex
CREATE INDEX "portfolio_teacher_id_idx" ON "portfolio"("teacher_id");

-- CreateIndex
CREATE INDEX "portfolio_file_type_idx" ON "portfolio"("file_type");

-- CreateIndex
CREATE INDEX "portfolio_created_at_idx" ON "portfolio"("created_at");

-- CreateIndex
CREATE INDEX "demo_videos_teacher_id_idx" ON "demo_videos"("teacher_id");

-- CreateIndex
CREATE INDEX "demo_videos_created_at_idx" ON "demo_videos"("created_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_teacher_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_school_admin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "school_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_teacher_fkey" FOREIGN KEY ("reporter_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_school_admin_fkey" FOREIGN KEY ("reporter_id") REFERENCES "school_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_teacher_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_school_admin_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "school_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_handled_by_fkey" FOREIGN KEY ("handled_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_school_admin_id_fkey" FOREIGN KEY ("school_admin_id") REFERENCES "school_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_endorser_id_fkey" FOREIGN KEY ("endorser_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_endorsed_id_fkey" FOREIGN KEY ("endorsed_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education" ADD CONSTRAINT "education_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio" ADD CONSTRAINT "portfolio_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_videos" ADD CONSTRAINT "demo_videos_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
