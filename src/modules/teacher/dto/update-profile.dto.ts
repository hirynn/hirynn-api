import { IsString, IsOptional, IsArray, IsInt, Min } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjectsTaught?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gradeLevels?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  yearsExperience?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  currentSchool?: string;
}
