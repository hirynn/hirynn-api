import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { EmploymentType, Prisma, ApplicationStatus } from '@prisma/client';

@Injectable()
export class SchoolService {
  constructor(private prisma: PrismaService) {}


  // School CRUD

  async createSchool(adminId: string, dto: CreateSchoolDto) {
    return this.prisma.school.create({
      data: { ...dto, schoolAdminId: adminId },
    });
  }

  async updateSchool(schoolId: string, dto: UpdateSchoolDto) {
    try {
      return await this.prisma.school.update({
        where: { id: schoolId },
        data: dto,
      });
    } catch (error) {
      throw new NotFoundException(`School with id ${schoolId} not found`);
    }
  }

  async deleteSchool(schoolId: string) {
    try {
      await this.prisma.school.delete({ where: { id: schoolId } });
      return { message: 'School deleted successfully' };
    } catch (error) {
      throw new NotFoundException(`School with id ${schoolId} not found`);
    }
  }

  async getSchools(
    adminId: string,
    page = 1,
    limit = 10,
    filters?: Partial<{ name: string; isVerified: boolean }>,
  ) {
    const where: any = { schoolAdminId: adminId };
    if (filters?.name)
      where.name = { contains: filters.name, mode: 'insensitive' };
    if (filters?.isVerified !== undefined)
      where.isVerified = filters.isVerified;

    const schools = await this.prisma.school.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await this.prisma.school.count({ where });
    return { total, page, limit, schools };
  }

  // =======================
  // Job CRUD
  // =======================
  async createJob(dto: CreateJobDto) {
    return this.prisma.job.create({
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
      throw new NotFoundException(`Job with id ${jobId} not found`);
    }
  }

  async deleteJob(jobId: string) {
    try {
      await this.prisma.job.delete({ where: { id: jobId } });
      return { message: 'Job deleted successfully' };
    } catch (error) {
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
    const where: any = { schoolId };
    if (filters?.title)
      where.title = { contains: filters.title, mode: 'insensitive' };
    if (filters?.subjects) where.subjects = { hasSome: filters.subjects };
    if (filters?.gradeLevels) where.gradeLevels = { hasSome: filters.gradeLevels };

    const jobs = await this.prisma.job.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await this.prisma.job.count({ where });
    return { total, page, limit, jobs };
  }

  // =======================
  // Teacher Job Application
  // =======================
  async applyToJob(teacherId: string, jobId: string, coverLetter?: string) {
    // Check if job exists
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Job with id ${jobId} not found`);

    // Prevent duplicate application
    const existing = await this.prisma.jobApplication.findUnique({
      where: { jobId_teacherId: { jobId, teacherId } },
    });
    if (existing) {
      throw new BadRequestException('You have already applied to this job');
    }

    return this.prisma.jobApplication.create({
      data: {
        jobId,
        teacherId,
        coverLetter: coverLetter ?? null,
        status: ApplicationStatus.SUBMITTED,
      },
    });
  }

async getApplicants(jobId: string, page = 1, limit = 10) {
  // Check if job exists
  const job = await this.prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new NotFoundException(`Job with id ${jobId} not found`);

  // Update all SUBMITTED applications to VIEWED
  await this.prisma.jobApplication.updateMany({
    where: {
      jobId,
      status: ApplicationStatus.SUBMITTED, // only SUBMITTED applications
    },
    data: {
      status: ApplicationStatus.VIEWED,
      statusUpdatedAt: new Date(),
    },
  });

  //  Fetch applications with teacher details
  const applications = await this.prisma.jobApplication.findMany({
    where: { jobId },
    skip: (page - 1) * limit,
    take: limit,
    include: { teacher: true },
  });

  // Count total applications
  const total = await this.prisma.jobApplication.count({ where: { jobId } });

  return { total, page, limit, applications };
}

async updateApplicationStatus(
  jobId: string,
  teacherId: string,
  dto: UpdateApplicationDto,
) {
  // Trim IDs to avoid invisible whitespace issues
  jobId = jobId.trim();
  teacherId = teacherId.trim();

  // First, check if the application exists
  const application = await this.prisma.jobApplication.findUnique({
    where: { jobId_teacherId: { jobId, teacherId } },
    include: { teacher: true ,job:true},
  });

  if (!application) {
    throw new NotFoundException(
      `Application for job ${jobId} by teacher ${teacherId} not found`,
    );
  }

  // Update the status and statusUpdatedAt
  const updatedApplication = await this.prisma.jobApplication.update({
    where: { jobId_teacherId: { jobId, teacherId } },
    data: {
      status: dto.status as ApplicationStatus,
      statusUpdatedAt: new Date(),
    },
    include: { teacher: true },
  });


  // Create notification
await this.prisma.notification.create({
  data: {
    teacherId: teacherId,        // must exist in Teacher table
    userType: 'TEACHER',      // make sure it's TEACHER
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
}


}
