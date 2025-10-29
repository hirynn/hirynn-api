import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [ReportController],
  providers: [ReportService, PrismaService],
  exports: [ReportService],
})
export class ReportModule {}
