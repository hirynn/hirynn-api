import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { EmploymentType, Prisma, WorkplaceType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { InitiateDirectoryConnectionDto } from './dto/initiate-directory-connection.dto';
import { CreateJobDto } from '../school/dto/create-job.dto';
import { UpdateJobDto } from '../school/dto/update-job.dto';
import { handlePrismaError } from '../../common/utils/prisma-error.util';

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

@Injectable()
export class IntegrationService {
  constructor(private prisma: PrismaService) {}

  private async generateCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const code = randomBytes(4).toString('hex').toUpperCase(); // 8 chars
      const exists = await this.prisma.directoryConnectionRequest.findUnique({
        where: { code },
      });
      if (!exists) return code;
    }
    throw new Error('Could not generate a unique connection code');
  }

  private isExpired(req: { status: string; expiresAt: Date }) {
    return req.status === 'pending' && req.expiresAt.getTime() < Date.now();
  }

  private async expireIfNeeded(request: any) {
    if (this.isExpired(request)) {
      return this.prisma.directoryConnectionRequest.update({
        where: { id: request.id },
        data: { status: 'expired' },
      });
    }
    return request;
  }

  // Called server-to-server by the Directory backend, with its own admin
  // session already verified on that side.
  async initiate(dto: InitiateDirectoryConnectionDto) {
    const code = await this.generateCode();
    const request = await this.prisma.directoryConnectionRequest.create({
      data: {
        code,
        directorySchoolId: dto.directorySchoolId,
        directorySchoolName: dto.directorySchoolName,
        directorySchoolLogo: dto.directorySchoolLogo,
        requestedByName: dto.requestedByName,
        requestedByEmail: dto.requestedByEmail,
        status: 'pending',
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });

    const base = (
      process.env.HIRYNN_FRONTEND_URL || 'http://localhost:3001'
    ).replace(/\/$/, '');

    return {
      code: request.code,
      connectUrl: `${base}/dashboard/connect-directory?code=${request.code}`,
      expiresAt: request.expiresAt,
    };
  }

  // Server-to-server reconciliation — lets Directory recover a link even if
  // its client-side poll never saw the "approved" transition (e.g. the admin
  // closed the tab, or the code expired client-side before the poll caught
  // up). Organization.directorySchoolId is the source of truth once set.
  async lookupByDirectorySchoolId(directorySchoolId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { directorySchoolId },
      select: { id: true },
    });
    return { organizationId: organization?.id };
  }

  // Polled server-to-server by the Directory backend.
  async getStatus(code: string) {
    const request = await this.prisma.directoryConnectionRequest.findUnique({
      where: { code },
    });
    if (!request) throw new NotFoundException('Connection request not found');

    const current = await this.expireIfNeeded(request);
    return {
      status: current.status,
      organizationId:
        current.status === 'approved' ? current.organizationId : undefined,
    };
  }

  // Loaded by the Hirynn dashboard's "authorize connection" screen.
  async getForHirynn(code: string, teacherId: string) {
    const request = await this.prisma.directoryConnectionRequest.findUnique({
      where: { code },
    });
    if (!request) throw new NotFoundException('Connection request not found');
    const current = await this.expireIfNeeded(request);

    const organizations = await this.prisma.organization.findMany({
      where: { teacherId },
      select: { id: true, name: true, logoUrl: true, directorySchoolId: true },
    });

    return {
      status: current.status,
      directorySchoolName: current.directorySchoolName,
      directorySchoolLogo: current.directorySchoolLogo,
      requestedByName: current.requestedByName,
      requestedByEmail: current.requestedByEmail,
      organizations,
    };
  }

  // Approved by an authenticated Hirynn school admin, picking which of their
  // organizations to link.
  async approve(code: string, teacherId: string, organizationId: string) {
    const request = await this.prisma.directoryConnectionRequest.findUnique({
      where: { code },
    });
    if (!request) throw new NotFoundException('Connection request not found');

    const current = await this.expireIfNeeded(request);
    if (current.status === 'expired') {
      throw new GoneException(
        'This connection request has expired. Please try again.',
      );
    }
    if (current.status === 'approved') {
      throw new ConflictException('This request has already been approved');
    }

    const organization = await this.prisma.organization.findFirst({
      where: { id: organizationId, teacherId },
    });
    if (!organization) {
      throw new ForbiddenException('You do not manage this organization');
    }
    if (
      organization.directorySchoolId &&
      organization.directorySchoolId !== current.directorySchoolId
    ) {
      throw new ConflictException(
        'This organization is already connected to a different directory school.',
      );
    }

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { directorySchoolId: current.directorySchoolId },
    });

    await this.prisma.directoryConnectionRequest.update({
      where: { id: current.id },
      data: { status: 'approved', organizationId },
    });

    return { success: true };
  }

  // =======================
  // Job management (proxied from the Directory dashboard, once connected)
  // =======================
  // The Directory backend has already verified the requesting admin owns
  // `organizationId` (via DirectorySchool.hirynnSchoolId) before calling
  // these — the ServiceSecretGuard only proves the *caller* is Directory,
  // not which school within it, so ownership of jobId is still checked here.

  private async assertOwnsJob(organizationId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, schoolId: organizationId },
    });
    if (!job) throw new NotFoundException(`Job with id ${jobId} not found`);
    return job;
  }

  async listJobs(organizationId: string, page = 1, limit = 20) {
    const where = { schoolId: organizationId };
    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);
    return { jobs, total, page, limit };
  }

  async createJob(organizationId: string, dto: CreateJobDto) {
    try {
      return await this.prisma.job.create({
        data: {
          title: dto.title,
          jobDescription: dto.jobDescription,
          keyResponsibilities: dto.keyResponsibilities ?? '',
          preferredSkills: dto.preferredSkills ?? '',
          subjects: dto.subjects,
          gradeLevels: dto.gradeLevels,
          location: dto.location,
          schoolId: organizationId,
          experienceRequired: dto.experienceRequired ?? '0',
          employmentType: dto.employmentType ?? EmploymentType.FULL_TIME,
          workplaceType: dto.workplaceType ?? WorkplaceType.ON_SITE,
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

  async updateJob(organizationId: string, jobId: string, dto: UpdateJobDto) {
    await this.assertOwnsJob(organizationId, jobId);
    try {
      const data: any = { ...dto };
      if (dto.subjects) data.subjects = { set: dto.subjects };
      if (dto.gradeLevels) data.gradeLevels = { set: dto.gradeLevels };
      if (dto.applicationDeadline)
        data.applicationDeadline = new Date(dto.applicationDeadline);
      if (dto.salaryMin !== undefined)
        data.salaryMin = dto.salaryMin ? new Prisma.Decimal(dto.salaryMin) : null;
      if (dto.salaryMax !== undefined)
        data.salaryMax = dto.salaryMax ? new Prisma.Decimal(dto.salaryMax) : null;

      return await this.prisma.job.update({ where: { id: jobId }, data });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async deleteJob(organizationId: string, jobId: string) {
    await this.assertOwnsJob(organizationId, jobId);
    await this.prisma.job.delete({ where: { id: jobId } });
    return { message: 'Job deleted successfully' };
  }
}
