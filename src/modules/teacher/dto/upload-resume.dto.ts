import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class UploadResumeDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  resumeUrl: string;
}