import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateEndorsementDto } from './dto/create-endorsement.dto';
import { QueryEndorsementDto } from './dto/query-endorsement.dto';

@Injectable()
export class EndorsementsService {
  constructor(private prisma: PrismaService) {}

  async create(endorserId: string, dto: CreateEndorsementDto) {
    if (endorserId === dto.endorsedId) {
      throw new BadRequestException('You cannot endorse yourself');
    }
    const endorsedExists = await this.prisma.teacher.findUnique({
      where: { id: dto.endorsedId },
    });
    if (!endorsedExists) {
      throw new NotFoundException('Endorsed teacher not found');
    }

    try {
      return await this.prisma.endorsement.create({
        data: {
          endorserId,
          endorsedId: dto.endorsedId,
          skill: dto.skill,
          message: dto.message,
        },
      });
    } catch (err) {
      if (err.code === 'P2002') {
        throw new BadRequestException('You have already endorsed this skill');
      }
      throw err;
    }
  }

  async findReceivedForSelf(userId: string, query: QueryEndorsementDto) {
    const {
      skill,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = query;

    const where: any = { endorsedId: userId };
    if (skill) where.skill = skill;
    if (search) where.message = { contains: search, mode: 'insensitive' };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.endorsement.findMany({
        where,
        include: {
          endorser: {
            select: {
              id: true,
              name: true,
              profilePhotoUrl: true,
              email: true,
            },
          },
        },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.endorsement.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async findGiven(teacherId: string, query: QueryEndorsementDto) {
    const {
      skill,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = query;

    const where: any = { endorserId: teacherId };
    if (skill) where.skill = skill;
    if (search) where.message = { contains: search, mode: 'insensitive' };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.endorsement.findMany({
        where,
        include: {
          endorsed: {
            select: {
              id: true,
              name: true,
              profilePhotoUrl: true,
              email: true,
            },
          },
        },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.endorsement.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }
  async findGivenForSelf(userId: string, query: QueryEndorsementDto) {
    return this.findGiven(userId, query);
  }
  async findSkillCounts(teacherId: string) {
    const endorsements = await this.prisma.endorsement.groupBy({
      by: ['skill'],
      where: { endorsedId: teacherId },
      _count: { skill: true },
      orderBy: { _count: { skill: 'desc' } },
    });

    return endorsements.map((e) => ({ skill: e.skill, count: e._count.skill }));
  }

  async findEndorsersForSkill(teacherId: string, skill: string) {
    return this.prisma.endorsement.findMany({
      where: { endorsedId: teacherId, skill },
      include: {
        endorser: {
          select: {
            id: true,
            name: true,
            profilePhotoUrl: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, userId: string) {
    const endorsement = await this.prisma.endorsement.findUnique({
      where: { id },
    });
    if (!endorsement) throw new NotFoundException('Endorsement not found');
    if (endorsement.endorserId !== userId) {
      throw new BadRequestException('You can only remove your own endorsement');
    }

    return this.prisma.endorsement.delete({ where: { id } });
  }
}
