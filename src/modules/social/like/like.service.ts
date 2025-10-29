import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { LikeDto, LikeQueryDto } from './dto/like.dto';
import { handlePrismaError } from '../../../common/utils/prisma-error.util';

@Injectable()
export class LikeService {
  constructor(private prisma: PrismaService) {}

  async toggleLike(userId: string, postId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existingLike = await tx.like.findUnique({
          where: { postId_userId: { postId, userId } },
        });

        if (existingLike) {
          await tx.like.delete({
            where: { postId_userId: { postId, userId } },
          });

          const updatedPost = await tx.post.update({
            where: { id: postId },
            data: { likesCount: { decrement: 1 } },
          });

          if (updatedPost.likesCount < 0) {
            await tx.post.update({
              where: { id: postId },
              data: { likesCount: 0 },
            });
          }

          return {
            message: 'Post unliked successfully',
            status: 'unliked',
          };
        } else {
          await tx.like.create({
            data: { postId, userId },
          });

          const updatedPost = await tx.post.update({
            where: { id: postId },
            data: { likesCount: { increment: 1 } },
          });

          return {
            message: 'Post liked successfully',
            status: 'liked',
          };
        }
      });
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async findAll(authUserId: string, query: LikeQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const where: any = { userId: authUserId };
    if (query.postId) where.postId = query.postId;

    try {
      const [likes, total] = await Promise.all([
        this.prisma.like.findMany({
          where,
          include: {
            post: {
              select: { id: true, content: true, authorId: true },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.like.count({ where }),
      ]);

      return {
        total,
        page,
        limit,
        likes,
      };
    } catch (err) {
      handlePrismaError(err);
    }
  }
}
