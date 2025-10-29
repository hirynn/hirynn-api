import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto, UpdateReportDto } from './dto/report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ReportStatus } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // Create a report (Teacher or SchoolAdmin)

  @Roles('TEACHER', 'SCHOOL_ADMIN')
  @Post()
  createReport(@Body() dto: CreateReportDto, @Req() req) {
    const reporterId = req.user?.id;
    const reporterType: 'TEACHER' | 'SCHOOL_ADMIN' =
      req.user?.type || req.user?.userType; // TEACHER or SCHOOL_ADMIN

    return this.reportService.create({ ...dto, reporterId, reporterType });
  }

  // Get all reports (Admin / Moderator) with pagination and optional status filter

  @Roles('SUPER_ADMIN', 'MODERATOR')
  @Get()
  getReports(@Query() query: any) {
    const { page = 1, limit = 20, status } = query;
    return this.reportService.findAll({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      status: status as ReportStatus,
    });
  }

  // Get single report (any authenticated user)

  @Roles('SUPER_ADMIN', 'MODERATOR', 'TEACHER', 'SCHOOL_ADMIN')
  @Get(':id')
  getReport(@Param('id') id: string) {
    return this.reportService.findOne(id);
  }

  // Handle / Update a report (Admin and moderator)

  @Roles('SUPER_ADMIN', 'MODERATOR')
  @Patch(':id')
  handleReport(
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
    @Req() req,
  ) {
    const handledBy = req.user?.id;
    return this.reportService.update(id, { ...dto, handledBy });
  }

  // Delete a report (Admin and moderator only)

  @Roles('SUPER_ADMIN', 'MODERATOR')
  @Delete(':id')
  deleteReport(@Param('id') id: string) {
    return this.reportService.remove(id);
  }

  // Get all reports made by a specific reporter

  @Roles('SUPER_ADMIN', 'MODERATOR')
  @Get('reporter/:reporterId')
  getReportsByReporter(
    @Param('reporterId') reporterId: string,
    @Query('type') type?: 'TEACHER' | 'SCHOOL_ADMIN',
  ) {
    return this.reportService.findByReporter(reporterId, type);
  }

  // Get all reports against a specific reported user

  @Roles('SUPER_ADMIN', 'MODERATOR')
  @Get('reported/:userId')
  getReportsAgainstUser(
    @Param('userId') userId: string,
    @Query('type') type?: 'TEACHER' | 'SCHOOL_ADMIN',
  ) {
    return this.reportService.findByReportedUser(userId, type);
  }
}
