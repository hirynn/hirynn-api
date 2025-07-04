import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({ example: 'google-token-here' })
  @IsString()
  @IsNotEmpty({ message: 'Google token is required' })
  googleToken: string;

  @ApiProperty({ example: 'TEACHER' })
  @IsEnum(['TEACHER', 'SCHOOL_ADMIN'], {
    message: 'User type must be TEACHER or SCHOOL_ADMIN',
  })
  userType: 'TEACHER' | 'SCHOOL_ADMIN';
}
