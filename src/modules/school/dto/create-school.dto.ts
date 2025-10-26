import { IsString, IsOptional, IsUrl, IsEmail, MaxLength,IsBoolean } from 'class-validator';

export class CreateSchoolDto {
  @IsString()
  @MaxLength(200)
  name: string;

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
