import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateJobOrganizationDto } from './dto/create-job-organization.dto';
import { UpdateJobOrganizationDto } from './dto/update-job-organization.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationStatus, EmploymentType } from '@prisma/client';
import { handlePrismaError } from '../../common/utils/prisma-error.util';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  // Generate unique slug

  private generateSlug(organizationName: string): string {
    return (
      organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') +
      '-' +
      Math.random().toString(36).substring(2, 6)
    );
  }

  // Resolve either slug or organizationId

  private async resolveOrganizationId(orgParam: string): Promise<string> {
    const org = await this.prisma.jobOrganization.findFirst({
      where: {
        OR: [
          { organizationId: orgParam }, // internal ID
          { slug: orgParam }, // public slug
        ],
      },
    });

    if (!org) throw new NotFoundException('Organization not found');

    return org.organizationId;
  }

  // Create a Job

  async createJob(
    organizationId: string | undefined,
    dto: CreateJobOrganizationDto,
  ) {
    try {
      const slug = dto.slug ?? this.generateSlug(dto.organizationName);
      const finalOrganizationId = organizationId ?? slug;

      return await this.prisma.jobOrganization.create({
        data: {
          ...dto,
          slug,
          organizationId: finalOrganizationId,
          employmentType: dto.employmentType ?? EmploymentType.FULL_TIME,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  // Update a Job

  async updateJob(
    orgParam: string,
    jobId: string,
    dto: UpdateJobOrganizationDto,
  ) {
    try {
      const organizationId = await this.resolveOrganizationId(orgParam);

      const job = await this.prisma.jobOrganization.findUnique({
        where: { id: jobId },
      });
      if (!job || job.organizationId !== organizationId) {
        throw new ForbiddenException('You are not allowed to update this job');
      }

      return await this.prisma.jobOrganization.update({
        where: { id: jobId },
        data: dto,
      });
    } catch (error) {
      handlePrismaError(error);
      throw new NotFoundException(`Job with id ${jobId} not found`);
    }
  }

  // Delete a Job

  async deleteJob(orgParam: string, jobId: string) {
    try {
      const organizationId = await this.resolveOrganizationId(orgParam);

      const job = await this.prisma.jobOrganization.findUnique({
        where: { id: jobId },
      });
      if (!job || job.organizationId !== organizationId) {
        throw new ForbiddenException('You are not allowed to delete this job');
      }

      await this.prisma.jobOrganization.delete({ where: { id: jobId } });
      return { message: 'Job deleted successfully' };
    } catch (error) {
      handlePrismaError(error);
      throw new NotFoundException(`Job with id ${jobId} not found`);
    }
  }

  // Get Jobs with filters

  async getJobs(
    orgParam: string,
    page = 1,
    limit = 10,
    filters?: Partial<{ title: string; location: string; isActive: boolean }>,
  ) {
    try {
      const organizationId = await this.resolveOrganizationId(orgParam);

      const where: any = { organizationId };
      if (filters?.title)
        where.title = { contains: filters.title, mode: 'insensitive' };
      if (filters?.location)
        where.location = { contains: filters.location, mode: 'insensitive' };
      if (filters?.isActive !== undefined) where.isActive = filters.isActive;

      const jobs = await this.prisma.jobOrganization.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await this.prisma.jobOrganization.count({ where });
      return { total, page, limit, jobs };
    } catch (error) {
      handlePrismaError(error);
    }
  }

  // Get Applicants for a Job

  async getApplicants(orgParam: string, jobId: string, page = 1, limit = 10) {
    try {
      const organizationId = await this.resolveOrganizationId(orgParam);

      const job = await this.prisma.jobOrganization.findUnique({
        where: { id: jobId },
      });
      if (!job || job.organizationId !== organizationId) {
        throw new ForbiddenException(
          'You are not allowed to view applicants for this job',
        );
      }

      const applications = await this.prisma.organizationApplication.findMany({
        where: { jobId },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await this.prisma.organizationApplication.count({
        where: { jobId },
      });
      return { total, page, limit, applications };
    } catch (error) {
      handlePrismaError(error);
    }
  }

  // Update Application Status

  async updateApplicationStatus(
    orgParam: string,
    jobId: string,
    applicationId: string,
    dto: UpdateApplicationDto,
  ) {
    try {
      const organizationId = await this.resolveOrganizationId(orgParam);

      const application = await this.prisma.organizationApplication.findUnique({
        where: { id: applicationId },
      });
      if (!application) throw new NotFoundException('Application not found');

      const job = await this.prisma.jobOrganization.findUnique({
        where: { id: jobId },
      });
      if (!job || job.organizationId !== organizationId) {
        throw new ForbiddenException(
          'You are not allowed to update this application',
        );
      }

      return await this.prisma.organizationApplication.update({
        where: { id: applicationId },
        data: { status: dto.status },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  // Public Job Application

  async publicApply(
    jobId: string,
    data: {
      fullName: string;
      email: string;
      phoneNumber?: string;
      currentCompany?: string;
      yearsOfExperience?: number;
      location?: string;
      linkedinUrl?: string;
      portfolioLink?: string;
      resumeUrl?: string;
      coverLetter?: string;
    },
  ) {
    const job = await this.prisma.jobOrganization.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new NotFoundException('Job not found');

    return this.prisma.organizationApplication.create({
      data: {
        jobId,
        ...data,
        status: ApplicationStatus.SUBMITTED,
      },
    });
  }
}
