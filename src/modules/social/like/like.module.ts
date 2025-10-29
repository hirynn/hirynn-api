import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { PrismaService } from '../../../database/prisma.service';

@Module({
  controllers: [LikeController],
  providers: [LikeService, PrismaService],
  exports: [LikeService],
})
export class LikeModule {}
