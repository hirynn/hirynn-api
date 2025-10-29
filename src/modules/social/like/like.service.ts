import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { LikeDto, LikeQueryDto } from './dto/like.dto';

@Injectable()
export class LikeService {
  constructor(private prisma: PrismaService) {}
  async toggleLike(userId: string, postId: string) {
    return this.prisma.$transaction(async (tx) => {
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
        //console.log(`like count ${updatedPost.likesCount}`);

        return {
          message: 'Post liked successfully',
          status: 'liked',
        };
      }
    });
  }

  async findAll(authUserId: string, query: LikeQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const where: any = {
      userId: authUserId,
    };

    if (query.postId) where.postId = query.postId;

    const likes = await this.prisma.like.findMany({
      where,
      include: {
        post: {
          select: { id: true, content: true, authorId: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.like.count({ where });

    return { total, page, limit, likes };
  }
}
