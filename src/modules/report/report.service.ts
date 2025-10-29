import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReportDto, UpdateReportDto } from './dto/report.dto';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateReportDto & {
      reporterId: string;
      reporterType: 'TEACHER' | 'SCHOOL_ADMIN';
    },
  ) {
    // Prevent self-report
    if (
      (dto.reportedTeacherId && dto.reportedTeacherId === dto.reporterId) ||
      (dto.reportedSchoolAdminId &&
        dto.reportedSchoolAdminId === dto.reporterId)
    ) {
      throw new BadRequestException('You cannot report yourself');
    }

    const data: any = {
      reason: dto.reason,
      description: dto.description,
      contentType: dto.contentType,
      reportedContentId: dto.reportedContentId,
      reporterType: dto.reporterType,
      reportedUserType: dto.reportedUserType,
    };

    // Connect reporter
    if (dto.reporterType === 'TEACHER') {
      data.reporterTeacher = { connect: { id: dto.reporterId } };
      data.reporterSchoolAdmin = undefined;
    } else if (dto.reporterType === 'SCHOOL_ADMIN') {
      data.reporterSchoolAdmin = { connect: { id: dto.reporterId } };
      data.reporterTeacher = undefined;
    }

    // Connect reported user
    if (dto.reportedUserType === 'TEACHER' && dto.reportedTeacherId) {
      data.reportedTeacher = { connect: { id: dto.reportedTeacherId } };
      data.reportedSchoolAdmin = undefined;
    } else if (
      dto.reportedUserType === 'SCHOOL_ADMIN' &&
      dto.reportedSchoolAdminId
    ) {
      data.reportedSchoolAdmin = { connect: { id: dto.reportedSchoolAdminId } };
      data.reportedTeacher = undefined;
    }

    return this.prisma.report.create({ data });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    status?: ReportStatus;
  }) {
    const { skip = 0, take = 20, status } = params || {};
    const where: any = {};
    if (status) where.status = status;

    const reports = await this.prisma.report.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reporterTeacher: {
          select: { id: true, name: true, email: true },
        },
        reporterSchoolAdmin: {
          select: { id: true, name: true, email: true },
        },
        reportedTeacher: {
          select: { id: true, name: true, email: true, profilePhotoUrl: true },
        },
        reportedSchoolAdmin: {
          select: { id: true, name: true, email: true },
        },
        handler: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    const total = await this.prisma.report.count({ where });
    return { total, page: skip / take + 1, limit: take, reports };
  }

  // Get single report

  async findOne(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        reporterTeacher: {
          select: { id: true, name: true, email: true },
        },
        reporterSchoolAdmin: {
          select: { id: true, name: true, email: true },
        },
        reportedTeacher: {
          select: { id: true, name: true, email: true, profilePhotoUrl: true },
        },
        reportedSchoolAdmin: {
          select: { id: true, name: true, email: true },
        },
        handler: {
          select: { id: true, name: true, role: true },
        },
      },
    });
    if (!report) throw new NotFoundException(`Report with id ${id} not found`);
    return report;
  }

  // Update a report (Admin)

  async update(id: string, dto: UpdateReportDto) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException(`Report with id ${id} not found`);

    if (dto.status && !Object.values(ReportStatus).includes(dto.status)) {
      throw new BadRequestException(`Invalid status: ${dto.status}`);
    }

    const resolvedAt =
      dto.status && dto.status !== ReportStatus.PENDING
        ? new Date()
        : report.resolvedAt;

    return this.prisma.report.update({
      where: { id },
      data: {
        ...dto,
        resolvedAt,
      },
    });
  }

  async remove(id: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException(`Report with id ${id} not found`);

    await this.prisma.report.delete({ where: { id } });
    return { message: 'Report deleted successfully' };
  }

  async findByReporter(
    reporterId: string,
    reporterType?: 'TEACHER' | 'SCHOOL_ADMIN',
  ) {
    const where: any = {};
    if (reporterType === 'TEACHER') where.reporterTeacherId = reporterId;
    else if (reporterType === 'SCHOOL_ADMIN')
      where.reporterSchoolAdminId = reporterId;

    return this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reporterTeacher: {
          select: { id: true, name: true, email: true },
        },
        reporterSchoolAdmin: {
          select: { id: true, name: true, email: true },
        },
        handler: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  }
  async findByReportedUser(
    userId: string,
    userType?: 'TEACHER' | 'SCHOOL_ADMIN',
  ) {
    const where: any = {};
    if (userType === 'TEACHER') where.reportedTeacherId = userId;
    else if (userType === 'SCHOOL_ADMIN') where.reportedSchoolAdminId = userId;

    return this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reportedTeacher: {
          select: { id: true, name: true, email: true },
        },
        reportedSchoolAdmin: {
          select: { id: true, name: true, email: true },
        },
        handler: { select: { id: true, name: true, role: true } },
      },
    });
  }
}
