import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { EmploymentType, Prisma, ApplicationStatus } from '@prisma/client';
import { handlePrismaError } from '../../common/utils/prisma-error.util';
import {
  CreateAnonymousApplicationDto,
  CVSubmissionDto,
} from './dto/CreateAnonymousApplicationDto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class SchoolService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  // =======================
  // School CRUD
  // =======================
  async createSchool(adminId: string, dto: CreateSchoolDto) {
    try {
      return await this.prisma.organization.create({
        data: { ...dto, schoolAdminId: adminId },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateSchool(schoolId: string, dto: UpdateSchoolDto) {
    try {
      return await this.prisma.organization.update({
        where: { id: schoolId },
        data: dto,
      });
    } catch (error) {
      handlePrismaError(error);
      throw new NotFoundException(`School with id ${schoolId} not found`);
    }
  }

  async deleteSchool(schoolId: string) {
    try {
      await this.prisma.organization.delete({ where: { id: schoolId } });
      return { message: 'School deleted successfully' };
    } catch (error) {
      handlePrismaError(error);
      throw new NotFoundException(`School with id ${schoolId} not found`);
    }
  }

  async getSchools(
    adminId: string,
    page = 1,
    limit = 10,
    filters?: Partial<{ name: string; isVerified: boolean }>,
  ) {
    try {
      const where: any = { schoolAdminId: adminId };
      if (filters?.name)
        where.name = { contains: filters.name, mode: 'insensitive' };
      if (filters?.isVerified !== undefined)
        where.isVerified = filters.isVerified;

      const schools = await this.prisma.organization.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await this.prisma.organization.count({ where });
      return { total, page, limit, schools };
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getSchoolById(id: string, adminId: string) {
    try {
      return await this.prisma.organization.findFirst({
        where: {
          id,
          schoolAdminId: adminId,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
  async getTeacherById(teacherId: string, isPublic = true) {
    try {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
        select: {
          id: true,
          name: true,
          profilePhotoUrl: true,
          bio: true,
          subjectsTaught: true,
          gradeLevels: true,
          currentSchool: true,
          location: true,
          demoVideos: true,
          certifications: true,
          education: true,
          endorsementsGiven: true,
          endorsementsReceived: true,
          followers: true,
          following: true,
          savedJobs: true,
          posts: true,
        },
      });

      if (!teacher)
        throw new NotFoundException(`Teacher with id ${teacherId} not found`);

      return teacher;
    } catch (err) {
      handlePrismaError(err);
    }
  }

  // =======================
  // Job CRUD
  // =======================
  async createJob(dto: CreateJobDto) {
    try {
      return await this.prisma.job.create({
        data: {
          title: dto.title,
          description: dto.description,
          subjects: dto.subjects,
          gradeLevels: dto.gradeLevels,
          location: dto.location,
          schoolId: dto.schoolId,
          experienceRequired: dto.experienceRequired ?? '0',
          employmentType: dto.employmentType ?? EmploymentType.FULL_TIME,
          salaryMin: dto.salaryMin ? new Prisma.Decimal(dto.salaryMin) : null,
          salaryMax: dto.salaryMax ? new Prisma.Decimal(dto.salaryMax) : null,
          requirements: dto.requirements ?? null,
          benefits: dto.benefits ?? null,
          applicationDeadline: dto.applicationDeadline
            ? new Date(dto.applicationDeadline)
            : null,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateJob(jobId: string, dto: UpdateJobDto) {
    try {
      const data: any = { ...dto };
      if (dto.subjects) data.subjects = { set: dto.subjects };
      if (dto.gradeLevels) data.gradeLevels = { set: dto.gradeLevels };
      if (dto.applicationDeadline)
        data.applicationDeadline = new Date(dto.applicationDeadline);
      if (dto.experienceRequired !== undefined)
        data.experienceRequired = String(dto.experienceRequired);
      if (dto.employmentType !== undefined)
        data.employmentType = dto.employmentType;

      return await this.prisma.job.update({
        where: { id: jobId },
        data,
      });
    } catch (error) {
      handlePrismaError(error);
      throw new NotFoundException(`Job with id ${jobId} not found`);
    }
  }
  async getJobById(jobId: string) {
    try {
      const job = await this.prisma.job.findUnique({ where: { id: jobId } });
      if (!job) {
        throw new NotFoundException(`Job with id ${jobId} not found`);
      }
      return job;
    } catch (error) {
      handlePrismaError(error);
      throw new NotFoundException(`Job with id ${jobId} not found`);
    }
  }

  async deleteJob(jobId: string) {
    try {
      await this.prisma.job.delete({ where: { id: jobId } });
      return { message: 'Job deleted successfully' };
    } catch (error) {
      handlePrismaError(error);
      throw new NotFoundException(`Job with id ${jobId} not found`);
    }
  }

  async getJobs(
    schoolId: string,
    page = 1,
    limit = 10,
    filters?: Partial<{
      title: string;
      subjects: string[];
      gradeLevels: string[];
    }>,
  ) {
    try {
      const where: any = { schoolId };
      if (filters?.title)
        where.title = { contains: filters.title, mode: 'insensitive' };
      if (filters?.subjects) where.subjects = { hasSome: filters.subjects };
      if (filters?.gradeLevels)
        where.gradeLevels = { hasSome: filters.gradeLevels };

      const jobs = await this.prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await this.prisma.job.count({ where });
      return { total, page, limit, jobs };
    } catch (error) {
      handlePrismaError(error);
    }
  }

  // =======================
  // Teacher Job Application
  // =======================
  async applyToJob(dto: {
    teacherId?: string;
    jobId: string;
    coverLetter?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    resumeUrl?: string;
    yearsExperience?: number;
    expectedSalary?: number;
    location?: string;
    currentCompany?: string;
    portfolioLink?: string;
  }) {
    const {
      teacherId,
      jobId,
      coverLetter,
      fullName,
      email,
      phone,
      resumeUrl,
      yearsExperience,
      expectedSalary,
      location,
      currentCompany,
      portfolioLink,
    } = dto;

    try {
      const job = await this.prisma.job.findUnique({ where: { id: jobId } });
      if (!job) throw new NotFoundException(`Job with id ${jobId} not found`);

      if (teacherId) {
        const teacher = await this.prisma.teacher.findUnique({
          where: { id: teacherId },
        });
        if (!teacher)
          throw new NotFoundException(`Teacher with id ${teacherId} not found`);

        const existing = await this.prisma.jobApplication.findUnique({
          where: { jobId_teacherId: { jobId, teacherId } },
        });
        if (existing)
          throw new BadRequestException('You have already applied to this job');

        return this.prisma.jobApplication.create({
          data: {
            jobId,
            teacherId,
            coverLetter: coverLetter ?? null,
            status: ApplicationStatus.SUBMITTED,
            fullName: teacher.name,
            email: teacher.email,
            phone: teacher.phone,
            resumeUrl: teacher.resumeUrl,
          },
        });
      } else {
        // --- Anonymous application ---
        if (!fullName || !email) {
          throw new BadRequestException(
            'Full name and email are required for anonymous application',
          );
        }

        return this.prisma.jobApplicationAnonymous.create({
          data: {
            jobId,
            fullName,
            email,
            phone,
            coverLetter,
            resumeUrl,
            yearsExperience,
            expectedSalary,
            location,
            currentCompany,
            portfolioLink,
            status: ApplicationStatus.SUBMITTED,
          },
        });
      }
    } catch (error) {
      handlePrismaError(error);
    }
  }

  /*async getApplicants(jobId: string, page = 1, limit = 10) {
    try {
      const job = await this.prisma.job.findUnique({ where: { id: jobId } });
      if (!job) throw new NotFoundException(`Job with id ${jobId} not found`);

      await this.prisma.jobApplication.updateMany({
        where: {
          jobId,
          status: ApplicationStatus.SUBMITTED,
        },
        data: {
          status: ApplicationStatus.VIEWED,
          statusUpdatedAt: new Date(),
        },
      });

      const applications = await this.prisma.jobApplication.findMany({
        where: { jobId },
        skip: (page - 1) * limit,
        take: limit,
        include: { teacher: true },
      });

      const total = await this.prisma.jobApplication.count({
        where: { jobId },
      });

      return { total, page, limit, applications };
    } catch (error) {
      handlePrismaError(error);
    }
  }*/
  async getApplicants(jobId: string, page = 1, limit = 10) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Job with id ${jobId} not found`);

    // Update all SUBMITTED → VIEWED
    await this.prisma.$transaction([
      this.prisma.jobApplication.updateMany({
        where: { jobId, status: ApplicationStatus.SUBMITTED },
        data: { status: ApplicationStatus.VIEWED, statusUpdatedAt: new Date() },
      }),
      this.prisma.jobApplicationAnonymous.updateMany({
        where: { jobId, status: ApplicationStatus.SUBMITTED },
        data: { status: ApplicationStatus.VIEWED, statusUpdatedAt: new Date() },
      }),
    ]);

    // Fetch all normal applicants
    const normalApps = await this.prisma.jobApplication.findMany({
      where: { jobId },
      include: { teacher: true },
    });

    // Fetch all anonymous applicants
    const anonymousApps = await this.prisma.jobApplicationAnonymous.findMany({
      where: { jobId },
    });

    // Merge & tag type
    const allApps = [
      ...normalApps.map((a) => ({ ...a, type: 'NORMAL' })),
      ...anonymousApps.map((a) => ({ ...a, type: 'ANONYMOUS' })),
    ];

    // Sort by appliedAt descending
    allApps.sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime());

    // Apply pagination
    const start = (page - 1) * limit;
    const paginatedApps = allApps.slice(start, start + limit);

    return {
      total: allApps.length,
      page,
      limit,
      applications: paginatedApps,
    };
  }
  async uploadAnonymousResume(file: Express.Multer.File) {
    const { url } = await this.cloudinaryService.uploadFile(
      file,
      'resumes/anonymous',
    );
    return {
      resumeUrl: url,
    };
  }
  async applyToJobAnonymous(
    jobId: string,
    dto: Partial<CreateAnonymousApplicationDto>,
    file?: Express.Multer.File,
  ) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Job with id ${jobId} not found`);

    let resumeUrl = dto.resumeUrl;
    if (file) {
      const upload = await this.uploadAnonymousResume(file);
      resumeUrl = upload.resumeUrl;
    }

    const application = await this.prisma.jobApplicationAnonymous.create({
      data: {
        jobId,
        fullName: dto.fullName || 'Anonymous User',
        email: dto.email || `anonymous${Date.now()}@noemail.com`,
        resumeUrl,
        phone: dto.phone,
        yearsExperience: dto.yearsExperience,
        expectedSalary: dto.expectedSalary,
        location: dto.location,
        currentCompany: dto.currentCompany,
        coverLetter: dto.coverLetter,
        portfolioLink: dto.portfolioLink,
      },
    });

    return {
      message: 'Application submitted successfully',
      application,
    };
  }

  async submitCvAnonymous(
    dto: Partial<CVSubmissionDto>,
    file?: Express.Multer.File,
  ) {
    let resumeUrl = dto.resumeUrl;
    if (file) {
      const upload = await this.uploadAnonymousResume(file);
      resumeUrl = upload.resumeUrl;
    }

    const cvSubmission = await this.prisma.cVSubmission.create({
      data: {
        schoolId: dto.schoolId || '',
        fullName: dto.fullName || 'Anonymous User',
        email: dto.email || `anonymous${Date.now()}@noemail.com`,
        resumeUrl,
        phone: dto.phone,
        yearsExperience: dto.yearsExperience,
        expectedSalary: dto.expectedSalary,
        location: dto.location,
        currentCompany: dto.currentCompany,
        coverLetter: dto.coverLetter,
        portfolioLink: dto.portfolioLink,
      },
    });

    return {
      message: 'CV submitted successfully',
      cvSubmission,
    };
  }

  async updateApplicationStatus(
    jobId: string,
    teacherId: string,
    dto: UpdateApplicationDto,
  ) {
    try {
      jobId = jobId.trim();
      teacherId = teacherId.trim();

      const application = await this.prisma.jobApplication.findUnique({
        where: { jobId_teacherId: { jobId, teacherId } },
        include: { teacher: true, job: true },
      });

      if (!application) {
        throw new NotFoundException(
          `Application for job ${jobId} by teacher ${teacherId} not found`,
        );
      }

      const updatedApplication = await this.prisma.jobApplication.update({
        where: { jobId_teacherId: { jobId, teacherId } },
        data: {
          status: dto.status as ApplicationStatus,
          statusUpdatedAt: new Date(),
        },
        include: { teacher: true },
      });

      await this.prisma.notification.create({
        data: {
          teacherId: teacherId,
          userType: 'TEACHER',
          type: 'APPLICATION_STATUS',
          title: `Your application has been ${dto.status}`,
          message: `Your application for the job "${application.job.title}" is now ${dto.status}`,
          data: {
            jobId,
            applicationId: application.id,
            newStatus: dto.status,
          },
          isRead: false,
        },
      });

      return updatedApplication;
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
