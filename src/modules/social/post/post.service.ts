import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

 
  async create(authorId: string, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        authorId,
        content: dto.content, // JSON content
      },
      include: {
        author: { select: { id: true, name: true, email: true, profilePhotoUrl: true } },
        comments: true,
        likes: true,
      },
    });
  }

  // Get paginated posts, optionally filtered by author 
  async findAll(
    page = 1,
    limit = 10,
    filters?: Partial<{ authorId: string }>
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.authorId) where.authorId = filters.authorId;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, email: true, profilePhotoUrl: true } },
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
  }

 
  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true, profilePhotoUrl: true } },
        comments: true,
        likes: true,
      },
    });

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

async update(postId: string, userId: string, dto: UpdatePostDto) {
  // Find the post
  const post = await this.prisma.post.findUnique({ where: { id: postId } });

  if (!post) throw new NotFoundException('Post not found');

  if (post.authorId !== userId) {
    throw new ForbiddenException('You are not allowed to update this post');
  }

 
const updatedContent: Prisma.InputJsonValue =
    post.content && typeof post.content === 'object' && dto.content
      ? { ...(post.content as Record<string, any>), ...dto.content }
      : (dto.content ?? (post.content ?? {})) as Prisma.InputJsonValue;

  // Update post
  return this.prisma.post.update({
    where: { id: postId },
    data: { content: updatedContent },
    include: {
      author: { select: { id: true, name: true, email: true, profilePhotoUrl: true } },
      comments: true,
      likes: true,
    },
  });
}

 //Delete a post (only by the author) 
  async remove(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) {
      throw new ForbiddenException('You are not allowed to delete this post');
    }

    return this.prisma.post.delete({ where: { id: postId } });
  }
}
