import { Module } from '@nestjs/common';
import { EndorsementsService } from './endorsements.service';
import { EndorsementsController } from './endorsements.controller';
import { PrismaService } from '../../../database/prisma.service';

@Module({
  controllers: [EndorsementsController],
  providers: [EndorsementsService, PrismaService],
  exports: [EndorsementsService],
})
export class EndorsementsModule {}
