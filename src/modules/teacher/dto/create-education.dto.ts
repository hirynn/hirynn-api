import { IsNotEmpty, IsOptional, IsString, IsInt, IsUrl, Min, Max } from 'class-validator';

export class CreateEducationDto {
  @IsNotEmpty()
  @IsString()
  degree: string;

  @IsNotEmpty()
  @IsString()
  institution: string;

  @IsNotEmpty()
  @IsString()
  fieldOfStudy: string;

  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 10)
  graduationYear: number;

  @IsOptional()
  @IsUrl()
  certificateUrl?: string;
}
