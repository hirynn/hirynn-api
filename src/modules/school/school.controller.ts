// school.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req,UseGuards } from '@nestjs/common';
import { SchoolService } from './school.service';
import { CreateSchoolDto} from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
@Controller('school')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  /** School CRUD */
    @Roles('SCHOOL_ADMIN')
  @Post() createSchool(@Req() req, @Body() dto: CreateSchoolDto) {
    return this.schoolService.createSchool(req.user?.id, dto);
  }
@Roles('SCHOOL_ADMIN')
  @Patch(':id') updateSchool(@Param('id') id: string, @Body() dto: UpdateSchoolDto) {
    return this.schoolService.updateSchool(id, dto);
  }
@Roles('SCHOOL_ADMIN')
  @Delete(':id') deleteSchool(@Param('id') id: string) {
    return this.schoolService.deleteSchool(id);
  }
@Roles('SCHOOL_ADMIN')
  @Get() getSchools(@Req() req, @Query() query: any) {
    const { page = 1, limit = 10, name, isVerified } = query;
    return this.schoolService.getSchools(req.user?.id, Number(page), Number(limit), {
      name,
      isVerified: isVerified !== undefined ? isVerified === 'true' : undefined,
    });
  }

  /** Job CRUD */
  @Roles('SCHOOL_ADMIN')
@Post('job')
async createJob(@Body() createJobDto: CreateJobDto) {
  return this.schoolService.createJob(createJobDto);
}

@Roles('SCHOOL_ADMIN')
  @Patch('job/:id') updateJob(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.schoolService.updateJob(id, dto);
  }
@Roles('SCHOOL_ADMIN')
  @Delete('job/:id') deleteJob(@Param('id') id: string) {
    return this.schoolService.deleteJob(id);

  }
@Roles('SCHOOL_ADMIN')
@Get('jobs')
getJobs(@Query() query: any) {
  const {
    schoolId,     
    page = 1,
    limit = 10,
    title,
    subjects,
    gradeLevels,
  } = query;

  return this.schoolService.getJobs(
    schoolId,               
    Number(page),
    Number(limit),
    {
      title,
      subjects: subjects ? [].concat(subjects) : undefined,
      gradeLevels: gradeLevels ? [].concat(gradeLevels) : undefined,
    },
  );
}

    /** Applications Handling */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER')
@Post('job/:jobId/apply')
applyJob(
  @Param('jobId') jobId: string,
  @Body() body: { coverLetter?: string },
  @Req() req
) {
  const teacherId = req.user.id; // comes from JWT
  return this.schoolService.applyToJob(teacherId, jobId, body.coverLetter);
}


  @Roles('SCHOOL_ADMIN')
  @Get('job/:jobId/applicants') getApplicants(@Param('jobId') jobId: string, @Query() query: any) {
    const { page = 1, limit = 10 } = query;
    return this.schoolService.getApplicants(jobId, Number(page), Number(limit));
  }
@Roles('SCHOOL_ADMIN')
  @Patch('job/:jobId/applicants/:teacherId')
  updateApplicationStatus(
    @Param('jobId') jobId: string,
    @Param('teacherId') teacherId: string,
    @Body() dto: UpdateApplicationDto
  ) {
    return this.schoolService.updateApplicationStatus(jobId, teacherId, dto);
  }
}
