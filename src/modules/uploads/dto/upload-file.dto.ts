import { IsEnum } from 'class-validator';
import { UploadFolder } from '@prisma/client';

export class UploadFileDto {
  @IsEnum(UploadFolder)
  folder: UploadFolder;
}
