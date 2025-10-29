import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Prisma } from '@prisma/client';
import { handlePrismaError } from '../../../common/utils/prisma-error.util';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async create(authorId: string, dto: CreatePostDto) {
    try {
      return await this.prisma.post.create({
        data: {
          authorId,
          content: dto.content,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePhotoUrl: true,
            },
          },
          comments: true,
          likes: true,
        },
      });
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async findAll(page = 1, limit = 10, filters?: Partial<{ authorId: string }>) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.authorId) where.authorId = filters.authorId;

    try {
      const [posts, total] = await Promise.all([
        this.prisma.post.findMany({
          where,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePhotoUrl: true,
              },
            },
            comments: true,
            likes: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.post.count({ where }),
      ]);

      return {
        data: posts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async findOne(id: string) {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePhotoUrl: true,
            },
          },
          comments: true,
          likes: true,
        },
      });

      if (!post) throw new NotFoundException('Post not found');
      return post;
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async update(postId: string, userId: string, dto: UpdatePostDto) {
    try {
      const post = await this.prisma.post.findUnique({ where: { id: postId } });

      if (!post) throw new NotFoundException('Post not found');
      if (post.authorId !== userId) {
        throw new ForbiddenException('You are not allowed to update this post');
      }

      const updatedContent: Prisma.InputJsonValue =
        post.content && typeof post.content === 'object' && dto.content
          ? { ...(post.content as Record<string, any>), ...dto.content }
          : (dto.content ?? (post.content ?? {})) as Prisma.InputJsonValue;

      return await this.prisma.post.update({
        where: { id: postId },
        data: { content: updatedContent },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePhotoUrl: true,
            },
          },
          comments: true,
          likes: true,
        },
      });
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async remove(postId: string, userId: string) {
    try {
      const post = await this.prisma.post.findUnique({ where: { id: postId } });

      if (!post) throw new NotFoundException('Post not found');
      if (post.authorId !== userId) {
        throw new ForbiddenException('You are not allowed to delete this post');
      }

      return await this.prisma.post.delete({ where: { id: postId } });
    } catch (err) {
      handlePrismaError(err);
    }
  }
}
