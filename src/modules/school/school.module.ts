import { Module } from '@nestjs/common';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';
import { PrismaService } from '../../database/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
@Module({
  controllers: [SchoolController],
  providers: [SchoolService, PrismaService, CloudinaryService],
  exports: [SchoolService],
})
export class SchoolModule {}
