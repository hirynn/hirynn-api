import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsDecimal,
} from 'class-validator';
import { EmploymentType, WorkplaceType } from '@prisma/client';

export class CreateJobDto {
  @IsString() title: string;
  @IsString() jobDescription: string;
  @IsString() keyResponsibilities: string;
  @IsString() preferredSkills: string;
  @IsString() schoolId: string;
  @IsEnum(EmploymentType) employmentType?: EmploymentType;
  @IsEnum(WorkplaceType) workplaceType?: WorkplaceType;
  @IsOptional() @IsArray() subjects: string[];
  @IsOptional() @IsArray() gradeLevels: string[];
  @IsOptional() @IsString() location: string;
  @IsOptional()
  @IsString()
  experienceRequired?: string;

  @IsOptional()
  @IsDecimal()
  salaryMin?: string;

  @IsOptional()
  @IsDecimal()
  salaryMax?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  benefits?: string;

  @IsOptional()
  @IsDateString()
  applicationDeadline?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
