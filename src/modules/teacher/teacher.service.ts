import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  UploadDemoVideoDto,
  UploadPortfolioDto,
  UploadCertificationDto,
} from './dto/upload.dto';
import { FollowDto } from './dto/follow.dto';
import { ApplicationStatus } from '@prisma/client';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { UploadResumeDto } from './dto/upload-resume.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
@Injectable()
export class TeacherService {
  constructor(private prisma: PrismaService, private cloudinaryService: CloudinaryService,) {}

  // Get teacher profile

  async getProfile(teacherId: string, isPublic = false) {
    const teacher = isPublic
      ? await this.prisma.teacher.findUnique({
          where: { id: teacherId },
          select: {
            id: true,
            name: true,
            profilePhotoUrl: true,
            bio: true,
            subjectsTaught: true,
            gradeLevels: true,
            currentSchool: true,
            location: true,
            portfolio: {
              select: {
                id: true,
                title: true,
                description: true,
                fileUrl: true,
                fileType: true,
                createdAt: true,
              },
            },
            demoVideos: {
              select: {
                id: true,
                title: true,
                description: true,
                videoUrl: true,
                thumbnailUrl: true,
                durationSeconds: true,
                createdAt: true,
              },
            },
          },
        })
      : await this.prisma.teacher.findUnique({
          where: { id: teacherId },
          include: {
            portfolio: true,
            demoVideos: true,
            certifications: true,
            education: true,
          },
        });

    if (!teacher)
      throw new NotFoundException(`Teacher with id ${teacherId} not found`);
    return teacher;
  }

  // Update teacher profile

  async updateProfile(teacherId: string, dto: UpdateProfileDto) {
    const data: any = {};

    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.currentSchool !== undefined) data.currentSchool = dto.currentSchool;
    if (dto.yearsExperience !== undefined)
      data.yearsExperience = dto.yearsExperience;
    if (dto.subjectsTaught !== undefined)
      data.subjectsTaught = dto.subjectsTaught;
    if (dto.gradeLevels !== undefined) data.gradeLevels = dto.gradeLevels;

    try {
      return await this.prisma.teacher.update({
        where: { id: teacherId },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          profilePhotoUrl: true,
          bio: true,
          subjectsTaught: true,
          gradeLevels: true,
          location: true,
          currentSchool: true,
          yearsExperience: true,
          isPremium: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          phone: true,
          googleId: true,
          linkedinId: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Teacher with id ${teacherId} not found`);
    }
  }

  // =======================
  // Upload portfolio
  // =======================
  async uploadPortfolio(teacherId: string, dto: UploadPortfolioDto) {
    // Ensure teacher exists
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher)
      throw new NotFoundException(`Teacher with id ${teacherId} not found`);

    return this.prisma.portfolio.create({
      data: { teacherId, ...dto },
    });
  }

  // Upload demo video

  async uploadDemoVideo(teacherId: string, dto: UploadDemoVideoDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher)
      throw new NotFoundException(`Teacher with id ${teacherId} not found`);

    return this.prisma.demoVideo.create({
      data: { teacherId, ...dto },
    });
  }
  // Upload certification

  async uploadCertification(teacherId: string, dto: UploadCertificationDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher)
      throw new NotFoundException(`Teacher with id ${teacherId} not found`);

    return this.prisma.certification.create({
      data: {
        teacherId,
        name: dto.name,
        issuingOrganization: dto.issuingOrganization,
        issueDate: new Date(dto.issueDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        certificateUrl: dto.certificateUrl,
      },
    });
  }

  // Follow teacher or school
  async follow(teacherId: string, dto: FollowDto) {
    // Prevent duplicate follow
    try {
      return await this.prisma.follow.create({
        data: {
          followerId: teacherId,
          followingId: dto.followingId,
          followingType: dto.followingType,
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002')
        throw new ConflictException('Already following');
      throw err;
    }
  }

  async unfollow(teacherId: string, dto: FollowDto) {
    try {
      await this.prisma.follow.delete({
        where: {
          followerId_followingId_followingType: {
            followerId: teacherId,
            followingId: dto.followingId,
            followingType: dto.followingType,
          },
        },
      });
      return { message: 'Unfollowed successfully' };
    } catch (err) {
      throw new NotFoundException(
        `Follow relationship not found for followingId ${dto.followingId}`,
      );
    }
  }

  //apllication job status
async getApplications(
  teacherId: string,
  page = 1,
  limit = 10,
  status?: ApplicationStatus,
) {
  if (!teacherId) throw new NotFoundException('Teacher not found');

  const where: any = { teacherId };
  if (status) where.status = status;

  const applications = await this.prisma.jobApplication.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    include: {
      job: {
        select: {
          id: true,
          title: true,
          location: true,
          employmentType: true,
          salaryMin: true,
          salaryMax: true,
          school: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { appliedAt: 'desc' },
  });

  const total = await this.prisma.jobApplication.count({ where });

  return { total, page, limit, applications };
}



  //appliction savejob
  async saveJob(teacherId: string, jobId: string) {
    try {
      return await this.prisma.savedJob.create({
        data: {
          teacherId,
          jobId,
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new ConflictException('Job already saved');
      }
      throw err;
    }
  }

  // Get all saved jobs
  async getSavedJobs(teacherId: string, page = 1, limit = 10) {
    const savedJobs = await this.prisma.savedJob.findMany({
      where: { teacherId },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            employmentType: true,
            salaryMin: true,
            salaryMax: true,
            school: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { savedAt: 'desc' },
    });

    const total = await this.prisma.savedJob.count({ where: { teacherId } });

    return { total, page, limit, savedJobs };
  }

  // Remove a saved job
  async removeSavedJob(teacherId: string, jobId: string) {
    const deleted = await this.prisma.savedJob.deleteMany({
      where: { teacherId, jobId },
    });

    if (!deleted.count) throw new NotFoundException('Saved job not found');

    return { message: 'Job removed from saved list' };
  }
  async create(teacherId: string, dto: CreateEducationDto) {
    return this.prisma.education.create({
      data: { teacherId, ...dto },
    });
  }

  async findAll(teacherId: string, isPublic = false) {
    return this.prisma.education.findMany({
      where: { teacherId },
      orderBy: { graduationYear: 'desc' },
      select: isPublic
        ? {
            degree: true,
            institution: true,
            fieldOfStudy: true,
            graduationYear: true,
            certificateUrl: true,
          }
        : undefined, // full record if private
    });
  }

  async findOne(id: string, isPublic = false) {
    const education = await this.prisma.education.findUnique({
      where: { id },
      select: isPublic
        ? {
            degree: true,
            institution: true,
            fieldOfStudy: true,
            graduationYear: true,
            certificateUrl: true,
          }
        : undefined,
    });
    if (!education) throw new NotFoundException(`Education with id ${id} not found`);
    return education;
  }

  async update(id: string, dto: UpdateEducationDto) {
    const existing = await this.prisma.education.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Education with id ${id} not found`);

    return this.prisma.education.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.education.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Education with id ${id} not found`);

    await this.prisma.education.delete({ where: { id } });
    return { message: 'Education deleted successfully' };
  }

  //upload resume
 async uploadResume(teacherId: string, file: Express.Multer.File) {
  const teacher = await this.prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, resumeUrl: true },
  });

  if (!teacher) throw new NotFoundException(`Teacher with id ${teacherId} not found`);

  // Delete old resume if exists
  if (teacher.resumeUrl) {
    try {
      const publicId = this.extractPublicId(teacher.resumeUrl);
      await this.cloudinaryService.deleteFile(publicId, true); // true = raw (PDF/Word)
    } catch (error) {
      console.error('Error deleting old resume:', error);
    }
  }

  // Upload new resume
  const { url } = await this.cloudinaryService.uploadFile(file, 'resumes');

  return this.prisma.teacher.update({
    where: { id: teacherId },
    data: { resumeUrl: url },
    select: {
      id: true,
      name: true,
      email: true,
      resumeUrl: true,
      updatedAt: true,
    },
  });
}

async deleteResume(teacherId: string) {
  const teacher = await this.prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, resumeUrl: true },
  });

  if (!teacher) throw new NotFoundException(`Teacher with id ${teacherId} not found`);

  if (teacher.resumeUrl) {
    try {
      const publicId = this.extractPublicId(teacher.resumeUrl);
      await this.cloudinaryService.deleteFile(publicId, true);
    } catch (error) {
      console.error('Error deleting resume from Cloudinary:', error);
    }
  }

  return this.prisma.teacher.update({
    where: { id: teacherId },
    data: { resumeUrl: null },
    select: {
      id: true,
      name: true,
      email: true,
      resumeUrl: true,
      updatedAt: true,
    },
  });
}

  async uploadProfilePhoto(teacherId: string, file: Express.Multer.File) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, profilePhotoUrl: true },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with id ${teacherId} not found`);
    }

    // Delete old photo from Cloudinary if exists
    if (teacher.profilePhotoUrl) {
      try {
        const urlParts = teacher.profilePhotoUrl.split('/');
        const publicIdWithExt = urlParts.slice(-2).join('/');
        const publicId = publicIdWithExt.split('.')[0];
        await this.cloudinaryService.deleteFile(publicId);
      } catch (error) {
        console.error('Error deleting old profile photo:', error);
      }
    }

    // Upload new photo
    const { url } = await this.cloudinaryService.uploadFile(file, 'profile_photos');

    return this.prisma.teacher.update({
      where: { id: teacherId },
      data: { profilePhotoUrl: url },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhotoUrl: true,
        updatedAt: true,
      },
    });
  }

  // Delete profile photo
  async deleteProfilePhoto(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, profilePhotoUrl: true },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with id ${teacherId} not found`);
    }

    if (teacher.profilePhotoUrl) {
      try {
        const urlParts = teacher.profilePhotoUrl.split('/');
        const publicIdWithExt = urlParts.slice(-2).join('/');
        const publicId = publicIdWithExt.split('.')[0];
        await this.cloudinaryService.deleteFile(publicId);
      } catch (error) {
        console.error('Error deleting profile photo from Cloudinary:', error);
      }
    }

    return this.prisma.teacher.update({
      where: { id: teacherId },
      data: { profilePhotoUrl: null },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhotoUrl: true,
        updatedAt: true,
      },
    });
  }
// Helper to extract Cloudinary publicId from URL
private extractPublicId(url: string): string {
  const parts = url.split('/');
  const lastTwo = parts.slice(-2).join('/');
  return lastTwo.split('.')[0];
}

}