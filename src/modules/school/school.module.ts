import { Module } from '@nestjs/common';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';
import { PrismaService } from '../../database/prisma.service';
import { UploadsModule } from '../uploads/uploads.module';
@Module({
  imports: [UploadsModule],
  controllers: [SchoolController],
  providers: [SchoolService, PrismaService],
  exports: [SchoolService],
})
export class SchoolModule {}
