import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { InitiateDirectoryConnectionDto } from './dto/initiate-directory-connection.dto';
import { ServiceSecretGuard } from './guards/service-secret.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateJobDto } from '../school/dto/create-job.dto';
import { UpdateJobDto } from '../school/dto/update-job.dto';

@Controller('integration/directory-connect')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  // Called by the Directory backend server-to-server — no Hirynn user
  // session exists yet.
  @UseGuards(ServiceSecretGuard)
  @Post('initiate')
  initiate(@Body() dto: InitiateDirectoryConnectionDto) {
    return this.integrationService.initiate(dto);
  }

  @UseGuards(ServiceSecretGuard)
  @Get(':code/status')
  getStatus(@Param('code') code: string) {
    return this.integrationService.getStatus(code);
  }

  // Recovery path — looks up an existing link directly, independent of any
  // particular connection-request code.
  @UseGuards(ServiceSecretGuard)
  @Get('lookup/:directorySchoolId')
  lookup(@Param('directorySchoolId') directorySchoolId: string) {
    return this.integrationService.lookupByDirectorySchoolId(directorySchoolId);
  }

  // Loaded by the Hirynn dashboard from an already-authenticated school admin.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Get(':code')
  getForHirynn(@Param('code') code: string, @Req() req) {
    return this.integrationService.getForHirynn(code, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Post(':code/approve')
  approve(
    @Param('code') code: string,
    @Req() req,
    @Body('organizationId') organizationId: string,
  ) {
    return this.integrationService.approve(code, req.user.id, organizationId);
  }

  // -------------------- Job management, proxied from Directory --------------------
  // Directory has already resolved & verified `organizationId` from its own
  // DirectorySchool.hirynnSchoolId before calling any of these.

  @UseGuards(ServiceSecretGuard)
  @Get('organizations/:organizationId/jobs')
  listJobs(
    @Param('organizationId') organizationId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.integrationService.listJobs(
      organizationId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @UseGuards(ServiceSecretGuard)
  @Post('organizations/:organizationId/jobs')
  createJob(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateJobDto,
  ) {
    return this.integrationService.createJob(organizationId, dto);
  }

  @UseGuards(ServiceSecretGuard)
  @Patch('organizations/:organizationId/jobs/:jobId')
  updateJob(
    @Param('organizationId') organizationId: string,
    @Param('jobId') jobId: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.integrationService.updateJob(organizationId, jobId, dto);
  }

  @UseGuards(ServiceSecretGuard)
  @Delete('organizations/:organizationId/jobs/:jobId')
  deleteJob(
    @Param('organizationId') organizationId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.integrationService.deleteJob(organizationId, jobId);
  }
}
