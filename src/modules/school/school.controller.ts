// school.controller.ts
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
  NotFoundException,
  FileTypeValidator,
  MaxFileSizeValidator,
  UploadedFile,
  ParseFilePipe,
  UseInterceptors,
} from '@nestjs/common';
import { SchoolService } from './school.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CreateAnonymousApplicationDto,
  CVSubmissionDto,
} from './dto/CreateAnonymousApplicationDto';
import { FileInterceptor } from '@nestjs/platform-express';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-auth.guard';
@Controller('school')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  /** School CRUD */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Post()
  createSchool(@Req() req, @Body() dto: CreateSchoolDto) {
    return this.schoolService.createSchool(req.user?.id, dto);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Patch(':id')
  updateSchool(@Param('id') id: string, @Body() dto: UpdateSchoolDto) {
    return this.schoolService.updateSchool(id, dto);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Delete(':id')
  deleteSchool(@Param('id') id: string) {
    return this.schoolService.deleteSchool(id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Get()
  getSchools(@Req() req, @Query() query: any) {
    const { page = 1, limit = 10, name, isVerified } = query;
    return this.schoolService.getSchools(
      req.user?.id,
      Number(page),
      Number(limit),
      {
        name,
        isVerified:
          isVerified !== undefined ? isVerified === 'true' : undefined,
      },
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Get('my-school')
  getMySchool(@Req() req) {
    return this.schoolService.getMySchool(req.user?.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Get(':id')
  getSchoolById(@Req() req, @Param('id') id: string) {
    return this.schoolService.getSchoolById(id, req.user.id);
  }

  /** School Asset Uploads */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @Param('id') id: string,
    @Req() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /(image\/jpeg|image\/png|image\/gif|image\/webp)$/i,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.schoolService.uploadSchoolLogo(id, file, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Post(':id/banner')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBanner(
    @Param('id') id: string,
    @Req() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /(image\/jpeg|image\/png|image\/gif|image\/webp)$/i,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.schoolService.uploadSchoolBanner(id, file, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Get('teacher/:id')
  async getTeacherById(@Param('id') id: string) {
    try {
      const teacher = await this.schoolService.getTeacherById(id);
      return teacher;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      // You can also handle other errors here
      throw err;
    }
  }

  /** Job CRUD */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Post('job')
  async createJob(@Body() createJobDto: CreateJobDto) {
    return this.schoolService.createJob(createJobDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SCHOOL_ADMIN')
  @Patch('job/:id')
  updateJob(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.schoolService.updateJob(id, dto);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SCHOOL_ADMIN')
  @Delete('job/:id')
  deleteJob(@Param('id') id: string) {
    return this.schoolService.deleteJob(id);
  }

  @Get('job/available')
  @UseGuards(OptionalJwtAuthGuard)
  getAvailableJobs(
    @Req() req,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('sort') sort: 'latest' | 'oldest' = 'latest',
    @Query('search') search?: string,
    @Query('title') title?: string,
    @Query('employmentType') employmentType?: string | string[],
    @Query('gradeLevels') gradeLevels?: string | string[],
    @Query('subjects') subjects?: string | string[],
    @Query('location') location?: string,
    @Query('experienceMin') experienceMin?: string,
    @Query('experienceMax') experienceMax?: string,
  ) {
    const userId = req.user?.id;
    return this.schoolService.getAvailableJobs(
      Number(page),
      Number(limit),
      sort,
      {
        search,
        title,
        location,
        employmentType: employmentType
          ? Array.isArray(employmentType)
            ? employmentType
            : [employmentType]
          : undefined,
        gradeLevels: gradeLevels
          ? Array.isArray(gradeLevels)
            ? gradeLevels
            : [gradeLevels]
          : undefined,
        subjects: subjects
          ? Array.isArray(subjects)
            ? subjects
            : [subjects]
          : undefined,
        experienceMin: experienceMin ? Number(experienceMin) : undefined,
        experienceMax: experienceMax ? Number(experienceMax) : undefined,
      },
      userId,
    );
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('SCHOOL_ADMIN')
  @Get('jobDetails/:id')
  getJob(@Param('id') id: string) {
    return this.schoolService.getJobById(id);
  }
  @Get('job/:schoolId')
  getJobs(@Param('schoolId') schoolId: string, @Query() query: any) {
    console.log('SCHOOL ID::', schoolId);
    const { page = 1, limit = 10, title, subjects, gradeLevels } = query;
    return this.schoolService.getJobs(schoolId, Number(page), Number(limit), {
      title,
      subjects,
      gradeLevels,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  @Post('job/:jobId/apply')
  applyJob(
    @Param('jobId') jobId: string,
    @Body() body: { coverLetter?: string },
    @Req() req,
  ) {
    const teacherId = req.user?.id;
    return this.schoolService.applyToJob({
      teacherId,
      jobId,
      coverLetter: body.coverLetter,
    });
  }
  @Post('job/:jobId/applyAnonymous')
  @UseInterceptors(FileInterceptor('file'))
  async applyJobAnonymous(
    @Param('jobId') jobId: string,
    @Body() dto: Partial<CreateAnonymousApplicationDto>,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType:
              /(pdf|doc|docx|application\/pdf|application\/msword|application\/vnd.openxmlformats-officedocument.wordprocessingml.document)$/i,
          }),
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.schoolService.applyToJobAnonymous(jobId, dto, file);
  }

  @Post('/cvSubmission')
  @UseInterceptors(FileInterceptor('file'))
  async submitCV(
    @Body() dto: Partial<CVSubmissionDto>,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType:
              /(pdf|doc|docx|application\/pdf|application\/msword|application\/vnd.openxmlformats-officedocument.wordprocessingml.document)$/i,
          }),
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.schoolService.submitCvAnonymous(dto, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SCHOOL_ADMIN')
  @Get('job/:jobId/applicants')
  getApplicants(@Param('jobId') jobId: string, @Query() query: any) {
    const { page = 1, limit = 10 } = query;
    return this.schoolService.getApplicants(jobId, Number(page), Number(limit));
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SCHOOL_ADMIN')
  @Patch('job/:jobId/applicants/:teacherId')
  updateApplicationStatus(
    @Param('jobId') jobId: string,
    @Param('teacherId') teacherId: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.schoolService.updateApplicationStatus(jobId, teacherId, dto);
  }
}
