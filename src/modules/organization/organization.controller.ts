import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateJobOrganizationDto } from './dto/create-job-organization.dto';
import { UpdateJobOrganizationDto } from './dto/update-job-organization.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post('job')
  createJob(
    @Query('organizationId') organizationId: string | undefined,
    @Body() dto: CreateJobOrganizationDto,
  ) {
    return this.organizationService.createJob(organizationId, dto);
  }

  // Update Job

  @Patch(':orgParam/job/:jobId')
  updateJob(
    @Param('orgParam') orgParam: string, // can be slug or organizationId
    @Param('jobId') jobId: string,
    @Body() dto: UpdateJobOrganizationDto,
  ) {
    return this.organizationService.updateJob(orgParam, jobId, dto);
  }

  // Delete Job

  @Delete(':orgParam/job/:jobId')
  deleteJob(
    @Param('orgParam') orgParam: string,
    @Param('jobId') jobId: string,
  ) {
    return this.organizationService.deleteJob(orgParam, jobId);
  }


  // Get Jobs with filters

  @Get(':orgParam/jobs')
  getJobs(
    @Param('orgParam') orgParam: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('title') title?: string,
    @Query('location') location?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters = {
      title,
      location,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    };
    return this.organizationService.getJobs(
      orgParam,
      Number(page) || 1,
      Number(limit) || 10,
      filters,
    );
  }


  // Get Applicants

  @Get(':orgParam/job/:jobId/applicants')
  getApplicants(
    @Param('orgParam') orgParam: string,
    @Param('jobId') jobId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.organizationService.getApplicants(
      orgParam,
      jobId,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  // Update Application Status

  @Patch(':orgParam/job/:jobId/applicants/:applicationId')
  updateApplicationStatus(
    @Param('orgParam') orgParam: string,
    @Param('jobId') jobId: string,
    @Param('applicationId') applicationId: string,
    @Body() body: UpdateApplicationDto,
  ) {
    return this.organizationService.updateApplicationStatus(
      orgParam,
      jobId,
      applicationId,
      body,
    );
  }

  // Public Apply for Job

  @Post('job/:jobId/apply')
  applyJob(
    @Param('jobId') jobId: string,
    @Body()
    body: {
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
    return this.organizationService.publicApply(jobId, body);
  }
}
