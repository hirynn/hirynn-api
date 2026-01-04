import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';

export class CreateAnonymousApplicationDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  currentCompany?: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @IsOptional()
  @IsNumber()
  yearsExperience?: number;

  @IsOptional()
  @IsNumber()
  expectedSalary?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  coverLetter?: string;

  @IsOptional()
  @IsString()
  portfolioLink?: string;
}

export class CVSubmissionDto {
  @IsNotEmpty()
  @IsString()
  schoolId: string;

  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty() // Changed: email is required in schema
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @IsOptional()
  @IsNumber()
  yearsExperience?: number;

  @IsOptional()
  @IsNumber()
  expectedSalary?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional() // Changed: currentCompany is optional in schema
  @IsString()
  currentCompany?: string;

  @IsOptional()
  @IsString()
  coverLetter?: string;

  @IsOptional()
  @IsString()
  portfolioLink?: string;
}
