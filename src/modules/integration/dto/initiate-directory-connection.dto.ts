import { IsOptional, IsString } from 'class-validator';

export class InitiateDirectoryConnectionDto {
  @IsString() directorySchoolId: string;
  @IsOptional() @IsString() directorySchoolName?: string;
  @IsOptional() @IsString() directorySchoolLogo?: string;
  @IsOptional() @IsString() requestedByName?: string;
  @IsOptional() @IsString() requestedByEmail?: string;
}
