import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  UploadDemoVideoDto,
  UploadPortfolioDto,
  UploadCertificationDto,
} from './dto/upload.dto';
import { FollowDto } from './dto/follow.dto';
import { ApplicationStatus, LisenceStatus } from '@prisma/client';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { UploadResumeDto } from './dto/upload-resume.dto';
import { UploadsService } from '../uploads/uploads.service';
import { UploadFolder } from '@prisma/client';
import { handlePrismaError } from '../../common/utils/prisma-error.util';
import { UploadLisenceDto } from './dto/upload-lisence.dto';

@Injectable()
export class TeacherService {
  constructor(
    private prisma: PrismaService,
    private uploadsService: UploadsService,
  ) {}

  // =======================
  // Get teacher profile
  // =======================
  async getProfile(teacherId: string, isPublic = false) {
    try {
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
              endorsementsGiven: true,
              endorsementsReceived: true,
              followers: true,
              // following: true,
              savedJobs: true,
              posts: true,
            },
          });

      if (!teacher)
        throw new NotFoundException(`Teacher with id ${teacherId} not found`);
      return teacher;
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async getTeacherProfileForApplication(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        resumeUrl: true,
        location: true,
        currentSchool: true,
        yearsExperience: true,
        profilePhotoUrl: true,
      },
    });
    if (!teacher)
      throw new NotFoundException('Teacher with id ${teacherId} not found');
    return teacher;
  }

  // =======================
  // Update teacher profile
  // =======================
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
    } catch (err) {
      handlePrismaError(err);
    }
  }

  // =======================
  // Upload portfolio
  // =======================
  async uploadPortfolio(teacherId: string, dto: UploadPortfolioDto) {
    try {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
      });
      if (!teacher)
        throw new NotFoundException(`Teacher with id ${teacherId} not found`);

      return await this.prisma.portfolio.create({
        data: { teacherId, ...dto },
      });
    } catch (err) {
      handlePrismaError(err);
    }
  }

  // Upload demo video
  async uploadDemoVideo(teacherId: string, dto: UploadDemoVideoDto) {
    try {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
      });
      if (!teacher)
        throw new NotFoundException(`Teacher with id ${teacherId} not found`);

      return await this.prisma.demoVideo.create({
        data: { teacherId, ...dto },
      });
    } catch (err) {
      handlePrismaError(err);
    }
  }

  // Upload certification
  async uploadCertification(teacherId: string, dto: UploadCertificationDto) {
    try {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
      });
      if (!teacher)
        throw new NotFoundException(`Teacher with id ${teacherId} not found`);

      return await this.prisma.certification.create({
        data: {
          teacherId,
          name: dto.name,
          issuingOrganization: dto.issuingOrganization,
          issueDate: new Date(dto.issueDate),
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          certificateUrl: dto.certificateUrl,
        },
      });
    } catch (err) {
      handlePrismaError(err);
    }
  }

  // =======================
  // Follow / Unfollow
  // =======================
  async follow(teacherId: string, dto: FollowDto) {
    try {
      return await this.prisma.follow.create({
        data: {
          followerId: teacherId,
          followingId: dto.followingId,
          followingType: dto.followingType,
        },
      });
    } catch (err) {
      handlePrismaError(err);
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
      handlePrismaError(err);
    }
  }

  // =======================
  // Job Applications
  // =======================
  async getApplications(
    teacherId: string,
    page = 1,
    limit = 10,
    search?: string,
    status?: ApplicationStatus,
    sort: 'latest' | 'oldest' = 'latest',
  ) {
    try {
      const where: any = { teacherId };
      if (status) where.status = status;
      if (search) {
        where.OR = {
          job: { title: { contains: search, mode: 'insensitive' } },
        };
      }

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
        orderBy: { appliedAt: sort === 'latest' ? 'desc' : 'asc' },
      });

      const total = await this.prisma.jobApplication.count({ where });
      return { total, page, limit, applications };
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async getApplicationById(applicationId: string, teacherId: string) {
    try {
      const application = await this.prisma.jobApplication.findFirst({
        where: { id: applicationId, teacherId },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              employmentType: true,
              salaryMin: true,
              salaryMax: true,
              requirements: true,
              school: {
                select: { id: true, name: true, address: true, logoUrl: true },
              },
            },
          },
        },
      });
      if (!application) {
        throw new NotFoundException('Application not found');
      }
      return application;
    } catch (e) {
      handlePrismaError(e);
    }
  }

  // =======================
  // Saved Jobs
  // =======================
  async saveJob(teacherId: string, jobId: string) {
    try {
      return await this.prisma.savedJob.create({
        data: { teacherId, jobId },
      });
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async getSavedJobs(teacherId: string, page = 1, limit = 10) {
    try {
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
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async removeSavedJob(teacherId: string, jobId: string) {
    try {
      const deleted = await this.prisma.savedJob.deleteMany({
        where: { teacherId, jobId },
      });
      if (!deleted.count) throw new NotFoundException('Saved job not found');
      return { message: 'Job removed from saved list' };
    } catch (err) {
      handlePrismaError(err);
    }
  }

  // =======================
  // Education
  // =======================
  async create(teacherId: string, dto: CreateEducationDto) {
    try {
      return await this.prisma.education.create({
        data: { teacherId, ...dto },
      });
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async findAll(teacherId: string, isPublic = false) {
    try {
      return await this.prisma.education.findMany({
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
          : undefined,
      });
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async findOne(id: string, isPublic = false) {
    try {
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
      if (!education)
        throw new NotFoundException(`Education with id ${id} not found`);
      return education;
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async update(id: string, dto: UpdateEducationDto) {
    try {
      const existing = await this.prisma.education.findUnique({
        where: { id },
      });
      if (!existing)
        throw new NotFoundException(`Education with id ${id} not found`);
      return await this.prisma.education.update({ where: { id }, data: dto });
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async remove(id: string) {
    try {
      const existing = await this.prisma.education.findUnique({
        where: { id },
      });
      if (!existing)
        throw new NotFoundException(`Education with id ${id} not found`);
      await this.prisma.education.delete({ where: { id } });
      return { message: 'Education deleted successfully' };
    } catch (err) {
      handlePrismaError(err);
    }
  }

  // =======================
  // Resume Upload/Delete
  // =======================
  async uploadResume(teacherId: string, file: Express.Multer.File) {
    try {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { id: true, resumeUrl: true },
      });

      if (!teacher)
        throw new NotFoundException(`Teacher with id ${teacherId} not found`);

      if (teacher.resumeUrl) {
        try {
          const uploadId = this.extractUploadId(teacher.resumeUrl);
          if (uploadId) {
            await this.uploadsService.softDelete(uploadId, {
              id: teacherId,
              isAdmin: false,
            });
          }
        } catch (error) {
          console.error('Error deleting old resume:', error);
        }
      }

      const { publicUrl } = await this.uploadsService.upload(
        file,
        UploadFolder.RESUMES,
        teacherId,
      );

      return await this.prisma.teacher.update({
        where: { id: teacherId },
        data: { resumeUrl: publicUrl },
        select: {
          id: true,
          name: true,
          email: true,
          resumeUrl: true,
          updatedAt: true,
        },
      });
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async deleteResume(teacherId: string) {
    try {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { id: true, resumeUrl: true },
      });

      if (!teacher)
        throw new NotFoundException(`Teacher with id ${teacherId} not found`);

      if (teacher.resumeUrl) {
        try {
          const uploadId = this.extractUploadId(teacher.resumeUrl);
          if (uploadId) {
            await this.uploadsService.softDelete(uploadId, {
              id: teacherId,
              isAdmin: false,
            });
          }
        } catch (error) {
          console.error('Error deleting resume:', error);
        }
      }

      return await this.prisma.teacher.update({
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
    } catch (err) {
      handlePrismaError(err);
    }
  }

  // =======================
  // Profile Photo Upload/Delete
  // =======================
  async uploadProfilePhoto(teacherId: string, file: Express.Multer.File) {
    try {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { id: true, profilePhotoUrl: true },
      });

      if (!teacher)
        throw new NotFoundException(`Teacher with id ${teacherId} not found`);

      if (teacher.profilePhotoUrl) {
        try {
          const uploadId = this.extractUploadId(teacher.profilePhotoUrl);
          if (uploadId) {
            await this.uploadsService.softDelete(uploadId, {
              id: teacherId,
              isAdmin: false,
            });
          }
        } catch (error) {
          console.error('Error deleting old profile photo:', error);
        }
      }

      const { publicUrl } = await this.uploadsService.upload(
        file,
        UploadFolder.PROFILE_PHOTOS,
        teacherId,
      );

      return await this.prisma.teacher.update({
        where: { id: teacherId },
        data: { profilePhotoUrl: publicUrl },
        select: {
          id: true,
          name: true,
          email: true,
          profilePhotoUrl: true,
          updatedAt: true,
        },
      });
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async deleteProfilePhoto(teacherId: string) {
    try {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { id: true, profilePhotoUrl: true },
      });

      if (!teacher)
        throw new NotFoundException(`Teacher with id ${teacherId} not found`);

      if (teacher.profilePhotoUrl) {
        try {
          const uploadId = this.extractUploadId(teacher.profilePhotoUrl);
          if (uploadId) {
            await this.uploadsService.softDelete(uploadId, {
              id: teacherId,
              isAdmin: false,
            });
          }
        } catch (error) {
          console.error('Error deleting profile photo:', error);
        }
      }

      return await this.prisma.teacher.update({
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
    } catch (err) {
      handlePrismaError(err);
    }
  }

  // =====================================================
  // Lisence upload, fetching & verification (super admin)
  // =====================================================

  async uploadLisence(
    teacherId: string,
    dto: UploadLisenceDto,
    file: Express.Multer.File,
  ) {
    try {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
      });
      if (!teacher) {
        throw new NotFoundException('Teacher with that id not found');
      }
      const { publicUrl } = await this.uploadsService.upload(
        file,
        UploadFolder.LISENCES,
        teacherId,
      );
      const lisence = await this.prisma.lisence.upsert({
        where: { teacherId },
        update: {
          lisenceNumber: dto.lisenceNumber,
          documentUrl: publicUrl,
          issuingOrganization: dto.issuingOrganization,
          status: LisenceStatus.PENDING,
        },
        create: {
          teacherId,
          lisenceNumber: dto.lisenceNumber,
          documentUrl: publicUrl,
          status: LisenceStatus.PENDING,
        },
      });
      return lisence;
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async verifyLisence(
    lisenceId: string,
    adminId: string,
    approve: boolean,
    rejectionReason?: string,
  ) {
    try {
      const lisence = await this.prisma.lisence.findUnique({
        where: { id: lisenceId },
      });
      if (!lisence) {
        throw new NotFoundException('Lisence with that id not found');
      }
      if (!approve && (!rejectionReason || rejectionReason.trim() === '')) {
        throw new BadRequestException(
          'Rejection reason is required when rejecting a lisence',
        );
      }
      const updatedLisence = await this.prisma.lisence.update({
        where: { id: lisenceId },
        data: {
          status: approve ? LisenceStatus.APPROVED : LisenceStatus.REJECTED,
          rejectionReason: approve ? null : rejectionReason,
          verifiedAt: new Date(),
          verifiedBy: adminId,
        },
      });
      return updatedLisence;
    } catch (e) {
      handlePrismaError(e);
    }
  }

  async getAllLisences(
    status: LisenceStatus = LisenceStatus.PENDING,
    page = 1,
    limit = 10,
    sort: 'latest' | 'oldest' = 'latest',
  ) {
    try {
      const where: any = { status };
      if (status) {
        where.status = status;
      }
      const lisences = await this.prisma.lisence.findMany({
        where,
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              profilePhotoUrl: true,
            },
          },
        },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: sort === 'latest' ? 'desc' : 'asc' },
      });
      const total = await this.prisma.lisence.count({ where });
      return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        lisences,
      };
    } catch (e) {
      console.error(e);
      handlePrismaError(e);
    }
  }

  async getLisenceById(lisenceId: string) {
    try {
      const lisence = await this.prisma.lisence.findUnique({
        where: { id: lisenceId },
        include: {
          teacher: true,
        },
      });
      if (!lisence) {
        throw new NotFoundException('Lisence with that id not found');
      }
      return lisence;
    } catch (e) {
      handlePrismaError(e);
    }
  }

  // Helper

  private extractUploadId(url: string): string | null {
    const match = url.match(/\/uploads\/file\/([^/?#]+)/);
    return match ? match[1] : null;
  }
}
