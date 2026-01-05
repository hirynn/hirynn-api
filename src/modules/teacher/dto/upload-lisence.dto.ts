import { IsBoolean, IsOptional, IsString } from 'class-validator';
export class UploadLisenceDto {
  @IsOptional()
  @IsString()
  lisenceNumber?: string;

  @IsOptional()
  @IsString()
  issuingOrganization: string;
}

export class VerifyLisenceDto {
  @IsBoolean()
  approve: boolean;

  @IsOptional()
  @IsString()
  rejectionReason: string;
}
