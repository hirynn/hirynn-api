import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { EmploymentType } from '@prisma/client';

export class CreateJobOrganizationDto {
  @IsString() title: string;
  @IsString() description: string;

  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsEnum(EmploymentType) employmentType?: EmploymentType;
  @IsOptional() @IsString() createdByName?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;

  @IsOptional() @IsString() slug?: string;                 
  @IsString() organizationName: string;                }
