import {
  IsString,
  IsOptional,
  IsUrl,
  IsEmail,
  MaxLength,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class JobPosterDto {
  @IsEmail()
  email: string;
}

export class CreateSchoolDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  type?: 'PUBLIC' | 'PRIVATE';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobPosterDto)
  jobPosters?: JobPosterDto[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  @IsOptional()
  @IsString()
  about?: string;

  @IsOptional()
  @IsString()
  vision?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(200)
  website?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;
  @IsOptional() @IsBoolean() isVerified?: boolean;
}
