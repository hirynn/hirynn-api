import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateJobOrganizationDto } from './dto/create-job-organization.dto';
import { UpdateJobOrganizationDto } from './dto/update-job-organization.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationStatus, EmploymentType, FollowType } from '@prisma/client';
import { handlePrismaError } from '../../common/utils/prisma-error.util';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  // organization page in design
  async getOrganizations(
    page: number = 1,
    limit: number = 10,
    userId?: string,
    tab: 'explore' | 'popular' | 'followed' = 'explore',
    search?: string,
  ) {
    try {
      const where: any = {};
      if (search) {
        where.name = { contains: search, mode: 'insensitive' };
      }
      let orderBy: any = { createdAt: 'desc' };

      // Handle followed tab
      if (tab === 'followed') {
        if (!userId) {
          return { page, limit, total: 0, data: [] };
        }
        const followedOrgs = await this.prisma.follow.findMany({
          where: {
            followerId: userId,
            followingType: FollowType.SCHOOL,
          },
          select: { followingId: true },
        });

        const followedIds = followedOrgs.map((f) => f.followingId);

        if (followedIds.length === 0) {
          return { page, limit, total: 0, data: [] };
        }

        where.id = { in: followedIds };
      }

      // Handle popular tab
      if (tab === 'popular') {
        const popularOrgIds = await this.prisma.follow.groupBy({
          by: ['followingId'],
          where: { followingType: FollowType.SCHOOL },
          _count: { followingId: true },
          orderBy: { _count: { followingId: 'desc' } },
        });

        const orderedIds = popularOrgIds.map((o) => o.followingId);

        if (orderedIds.length === 0) {
          return { page, limit, total: 0, data: [] };
        }

        where.id = { in: orderedIds };
      }

      // Fetch organizations
      const [allOrganizations, total] = await Promise.all([
        this.prisma.organization.findMany({
          where,
          include: { _count: { select: { jobs: true } } },
        }),
        this.prisma.organization.count({ where }),
      ]);

      let organizations = allOrganizations;

      // Handle popular tab ordering and pagination
      if (tab === 'popular') {
        const popularOrgIds = await this.prisma.follow.groupBy({
          by: ['followingId'],
          where: { followingType: FollowType.SCHOOL },
          _count: { followingId: true },
          orderBy: { _count: { followingId: 'desc' } },
        });

        const orderMap = new Map(
          popularOrgIds.map((org, index) => [org.followingId, index]),
        );

        // Sort by popularity
        organizations = allOrganizations.sort((a, b) => {
          const orderA = orderMap.get(a.id) ?? Infinity;
          const orderB = orderMap.get(b.id) ?? Infinity;
          return orderA - orderB;
        });

        // Apply pagination
        const start = (page - 1) * limit;
        organizations = organizations.slice(start, start + limit);
      } else {
        // Apply pagination for explore and followed tabs
        const start = (page - 1) * limit;
        organizations = allOrganizations
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(start, start + limit);
      }

      // Get follower counts for the paginated organizations
      const orgIds = organizations.map((org) => org.id);

      if (orgIds.length === 0) {
        return { page, limit, total, data: [] };
      }

      const followerCounts = await this.prisma.follow.groupBy({
        by: ['followingId'],
        where: {
          followingType: FollowType.SCHOOL,
          followingId: { in: orgIds },
        },
        _count: { followingId: true },
      });

      const followerCountMap = new Map(
        followerCounts.map((f) => [f.followingId, f._count.followingId]),
      );

      // Get followed status for current user
      const followedOrgIds = userId
        ? new Set(
            (
              await this.prisma.follow.findMany({
                where: {
                  followerId: userId,
                  followingType: FollowType.SCHOOL,
                  followingId: { in: orgIds },
                },
                select: { followingId: true },
              })
            ).map((f) => f.followingId),
          )
        : new Set<string>();

      // Map to response format
      const data = organizations.map((org) => ({
        id: org.id,
        name: org.name,
        logoUrl: org.logoUrl,
        bannerUrl: org.bannerUrl,
        about: org.about,
        isVerified: org.isVerified,
        createdAt: org.createdAt,
        jobsCount: org._count.jobs,
        followersCount: followerCountMap.get(org.id) ?? 0,
        isFollowed: followedOrgIds.has(org.id),
        isActive: 'active', // TODO: implement actual isActive logic
      }));

      return { page, limit, totalPages: Math.ceil(total / limit), total, data };
    } catch (err) {
      handlePrismaError(err);
      // If handlePrismaError doesn't throw, return empty result
      return { page, limit, total: 0, data: [] };
    }
  }

  async getOrganizationById(orgId: string) {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: orgId },
      });
      if (!organization) {
        throw new Error('Organization not found');
      }
      const followerCountResult = await this.prisma.follow.count({
        where: {
          followingType: FollowType.SCHOOL,
          followingId: orgId,
        },
      });
      return {
        organization,
        followerCount: followerCountResult,
      };
    } catch (e) {
      handlePrismaError(e);
    }
  }
}
