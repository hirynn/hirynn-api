import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ContactReason } from '@prisma/client';

export class CreateContactQueryDto {
  @IsString()
  @MaxLength(100)
  fullName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(ContactReason)
  reason: ContactReason;

  @IsString()
  @MaxLength(200)
  message: string;
}
