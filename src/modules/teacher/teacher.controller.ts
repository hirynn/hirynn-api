import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Post,
  Delete,
  Query,
  Req,
  Request,
  NotFoundException,
  ForbiddenException,
  UseGuards,
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseFilePipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  UploadDemoVideoDto,
  UploadPortfolioDto,
  UploadCertificationDto,
} from './dto/upload.dto';
import { FollowDto } from './dto/follow.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApplicationStatus } from '@prisma/client';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { UploadResumeDto } from './dto/upload-resume.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER')
export class TeacherController {
  constructor(private teacherService: TeacherService) {}

  // =======================
  // Applications
  // =======================
  @Get('applications')
  async getApplications(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: ApplicationStatus,
  ) {
    const teacherId = req.user?.id;
    if (!teacherId) throw new NotFoundException('Teacher not found');

    return this.teacherService.getApplications(
      teacherId,
      Number(page),
      Number(limit),
      status,
    );
  }

  // =======================
  // Saved Jobs
  // =======================
  @Post('saved-jobs/:jobId')
  async saveJob(@Req() req: any, @Param('jobId') jobId: string) {
    const teacherId = req.user?.id;
    return this.teacherService.saveJob(teacherId, jobId);
  }

  @Get('saved-jobs')
  async getSavedJobs(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const teacherId = req.user?.id;
    return this.teacherService.getSavedJobs(
      teacherId,
      Number(page),
      Number(limit),
    );
  }

  @Delete('saved-jobs/:jobId')
  async removeSavedJob(@Req() req: any, @Param('jobId') jobId: string) {
    const teacherId = req.user?.id;
    return this.teacherService.removeSavedJob(teacherId, jobId);
  }

  // =======================
  // Profile
  // =======================
  @Get(':id')
  getProfile(@Param('id') id: string, @Query('public') isPublic?: string) {
    return this.teacherService.getProfile(id, isPublic === 'true');
  }

  @Patch(':id')
  updateProfile(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.teacherService.updateProfile(id, dto);
  }

  // =======================
  // Portfolio / Demo / Certification / Follow
  // =======================
  @Post(':id/portfolio')
  uploadPortfolio(@Param('id') id: string, @Body() dto: UploadPortfolioDto) {
    return this.teacherService.uploadPortfolio(id, dto);
  }

  @Post(':id/demo-videos')
  uploadDemoVideo(@Param('id') id: string, @Body() dto: UploadDemoVideoDto) {
    return this.teacherService.uploadDemoVideo(id, dto);
  }

  @Post(':id/certifications')
  uploadCertification(
    @Param('id') id: string,
    @Body() dto: UploadCertificationDto,
  ) {
    return this.teacherService.uploadCertification(id, dto);
  }

  @Post(':id/follow')
  follow(@Param('id') id: string, @Body() dto: FollowDto) {
    return this.teacherService.follow(id, dto);
  }

  @Delete(':id/unfollow')
  unfollow(@Param('id') id: string, @Body() dto: FollowDto) {
    return this.teacherService.unfollow(id, dto);
  }

  // =======================
  // Education CRUD
  // =======================
  @Post(':teacherId/education')
  async createEducation(
    @Param('teacherId') teacherId: string,
    @Body() dto: CreateEducationDto,
    @Request() req,
  ) {
    if (req.user?.id !== teacherId) {
      throw new ForbiddenException(
        'You can only add education to your own profile',
      );
    }
    return this.teacherService.create(teacherId, dto);
  }

  @Get(':teacherId/education')
  async findAllEducation(
    @Param('teacherId') teacherId: string,
    @Query('public') isPublic?: string,
  ) {
    return this.teacherService.findAll(teacherId, isPublic === 'true');
  }

  @Get(':teacherId/education/:id')
  async findOneEducation(
    @Param('id') id: string,
    @Query('public') isPublic?: string,
  ) {
    return this.teacherService.findOne(id, isPublic === 'true');
  }

  @Patch(':teacherId/education/:id')
  async updateEducation(
    @Param('teacherId') teacherId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEducationDto,
    @Request() req,
  ) {
    if (req.user.id !== teacherId) {
      throw new ForbiddenException(
        'You can only update your own education',
      );
    }
    return this.teacherService.update(id, dto);
  }

  @Delete(':teacherId/education/:id')
  async removeEducation(
    @Param('teacherId') teacherId: string,
    @Param('id') id: string,
    @Request() req,
  ) {
    if (req.user.id !== teacherId) {
      throw new ForbiddenException(
        'You can only delete your own education',
      );
    }
    return this.teacherService.remove(id);
  }

  //resumehai
 @Post('resume')
@UseInterceptors(FileInterceptor('file'))
async uploadResume(
  @UploadedFile(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        new FileTypeValidator({
          fileType: /(pdf|doc|docx|application\/pdf|application\/msword|application\/vnd.openxmlformats-officedocument.wordprocessingml.document)$/i,
        }),
      ],
    }),
  )
  file: Express.Multer.File,
  @Request() req,
) {
  const teacherId = req.user?.id;
  return this.teacherService.uploadResume(teacherId, file);
}

@Delete('resume')
async deleteResume(@Request() req) {
  const teacherId = req.user?.id;
  return this.teacherService.deleteResume(teacherId);
}
  @Post('profile-photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePhoto(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpeg|jpg|png)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Request() req,
  ) {
    const teacherId = req.user.id;
    return this.teacherService.uploadProfilePhoto(teacherId, file);
  }

  // Delete profile photo
  @Delete(':id/profile-photo')
  async deleteProfilePhoto(@Param('id') id: string, @Request() req) {
    if (req.user?.id !== id) {
      throw new ForbiddenException('You can only delete your own profile photo');
    }
    return this.teacherService.deleteProfilePhoto(id);
  }
}
