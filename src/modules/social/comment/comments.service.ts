import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCommentDto, authorId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: dto.postId },
    });
    if (!post) throw new NotFoundException('Post not found');

    const comment = await this.prisma.comment.create({
      data: {
        postId: dto.postId,
        authorId: authorId,
        content: dto.content,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    // Increment comments count on post
    await this.prisma.post.update({
      where: { id: dto.postId },
      data: { commentsCount: { increment: 1 } },
    });

    return comment;
  }

  async findAll(postId: string, authorId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where = {
      postId,
      authorId,
    };

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        include: {
          author: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      data: comments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: true },
    });

    if (!comment) throw new NotFoundException('Comment not found');

    if (comment.authorId !== userId) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }
  async update(commentId: string, dto: UpdateCommentDto, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) throw new NotFoundException('Comment not found');

    // Only the author can update
    if (comment.authorId !== userId) {
      throw new NotFoundException('you are not allowded to updated comment');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { ...dto },
    });
  }
  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    // Only the author can update
    if (comment.authorId !== userId) {
      throw new NotFoundException('you are not allowded to delete comment');
    }
    await this.prisma.comment.delete({ where: { id } });

    // Decrement count on Post
    await this.prisma.post.update({
      where: { id: comment.postId },
      data: { commentsCount: { decrement: 1 } },
    });

    return { message: 'Comment deleted successfully' };
  }
}
