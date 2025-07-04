import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export class LinkedInAuthDto {
  @ApiProperty({ example: 'linkedIn-token-here' })
  @IsString()
  @IsNotEmpty({ message: 'LinkedIn token is required' })
  linkedInToken: string;

  @ApiProperty({ example: 'TEACHER' })
  @IsEnum(['TEACHER', 'SCHOOL_ADMIN'], {
    message: 'User type must be TEACHER or SCHOOL_ADMIN',
  })
  userType: 'TEACHER' | 'SCHOOL_ADMIN';
}
