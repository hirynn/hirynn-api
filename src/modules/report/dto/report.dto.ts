import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ReportStatus } from '@prisma/client';

export class CreateReportDto {
  @IsOptional()
  @IsString()
  reportedTeacherId?: string;

  @IsOptional()
  @IsString()
  reportedSchoolAdminId?: string;

  @IsOptional()
  @IsString()
  reportedContentId?: string;

  @IsOptional()
  @IsEnum(['TEACHER', 'SCHOOL_ADMIN'])
  reportedUserType?: 'TEACHER' | 'SCHOOL_ADMIN';

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  description?: string;
}
export class UpdateReportDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsDateString()
  resolvedAt?: string;
  @IsOptional()
  @IsString()
  handledBy?: string;
}
