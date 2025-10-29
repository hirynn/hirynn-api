import { Module } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { TeacherController } from './teacher.controller';
import { PrismaService } from '../../database/prisma.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
@Module({
   imports: [CloudinaryModule],
  controllers: [TeacherController],
  providers: [TeacherService, PrismaService],
  exports: [TeacherService],
})
export class TeacherModule {}
