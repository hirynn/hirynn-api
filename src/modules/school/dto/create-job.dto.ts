import { IsString, IsArray, IsOptional, IsEnum, IsDateString, IsBoolean, IsDecimal } from 'class-validator';
import { EmploymentType } from '@prisma/client';

export class CreateJobDto {
  @IsString() title: string;
  @IsString() description: string;
  @IsArray() subjects: string[];
  @IsArray() gradeLevels: string[];
  @IsString() location: string;
  @IsString() schoolId: string;

  @IsOptional()
  @IsString() experienceRequired?: string;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsDecimal()
  salaryMin?: string;

  @IsOptional()
  @IsDecimal()
  salaryMax?: string;

  @IsOptional()
  @IsString() requirements?: string;

  @IsOptional()
  @IsString() benefits?: string;

  @IsOptional()
  @IsDateString() applicationDeadline?: string;

  @IsOptional()
  @IsBoolean() isActive?: boolean;
}
