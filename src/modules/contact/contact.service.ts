import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateContactQueryDto } from './dto/create-query.dto';
@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateContactQueryDto) {
    return this.prisma.contactQuery.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        reason: dto.reason,
        message: dto.message,
      },
    });
  }
  async findAll() {
    return this.prisma.contactQuery.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
  async markAsRead(id: string) {
    return this.prisma.contactQuery.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
