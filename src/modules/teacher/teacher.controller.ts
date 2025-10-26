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
  NotFoundException,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  UploadDemoVideoDto,
  UploadPortfolioDto,
  UploadCertificationDto,
} from './dto/upload.dto';
import { FollowDto } from './dto/follow.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApplicationStatus } from '@prisma/client';
@Controller('teachers')
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles('TEACHER')

export class TeacherController {
  constructor(private teacherService: TeacherService) {}
//application viewing of own
  @Get('applications')
  async getApplications(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const teacherId = req.user?.id;
    if (!teacherId) throw new NotFoundException('Teacher not found');

    return this.teacherService.getApplications(
      teacherId,
      Number(page),
      Number(limit),
    );
}

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
  // GET /teachers/:id?public=true
  @Get(':id')
  getProfile(@Param('id') id: string, @Query('public') isPublic?: string) {
    return this.teacherService.getProfile(id, isPublic === 'true');
  }

  // PATCH /teachers/:id
  @Patch(':id')
  updateProfile(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.teacherService.updateProfile(id, dto);
  }

  // POST /teachers/:id/portfolio
  @Post(':id/portfolio')
  uploadPortfolio(@Param('id') id: string, @Body() dto: UploadPortfolioDto) {
    return this.teacherService.uploadPortfolio(id, dto);
  }

  // POST /teachers/:id/demo-videos
  @Post(':id/demo-videos')
  uploadDemoVideo(@Param('id') id: string, @Body() dto: UploadDemoVideoDto) {
    return this.teacherService.uploadDemoVideo(id, dto);
  }

  // POST /teachers/:id/certifications
  @Post(':id/certifications')
  uploadCertification(
    @Param('id') id: string,
    @Body() dto: UploadCertificationDto,
  ) {
    return this.teacherService.uploadCertification(id, dto);
  }

  // POST /teachers/:id/follow
  @Post(':id/follow')
  follow(@Param('id') id: string, @Body() dto: FollowDto) {
    return this.teacherService.follow(id, dto);
  }

  // DELETE /teachers/:id/unfollow
  @Delete(':id/unfollow')
  unfollow(@Param('id') id: string, @Body() dto: FollowDto) {
    return this.teacherService.unfollow(id, dto);
  }

}
