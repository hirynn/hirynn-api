import { IsString, IsOptional, IsUrl, IsInt, Min } from 'class-validator';

export class UploadPortfolioDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUrl()
  fileUrl: string;

  @IsString()
  fileType: string; // e.g., "pdf", "image"
}

export class UploadDemoVideoDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUrl()
  videoUrl: string;

  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsInt()
  @Min(1)
  durationSeconds: number;
}

export class UploadCertificationDto {
  @IsString()
  name: string;

  @IsString()
  issuingOrganization: string;

  @IsString()
  issueDate: string; // ISO date string

  @IsOptional()
  @IsString()
  expiryDate?: string; // ISO date string

  @IsOptional()
  @IsUrl()
  certificateUrl?: string;
}
