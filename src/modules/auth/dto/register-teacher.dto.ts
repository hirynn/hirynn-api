import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterTeacherDto {
  @ApiProperty({ example: 'teacher@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Please provide a valid phone number',
  })
  phone?: string;

  @ApiProperty({ example: 'New York, NY', required: false })
  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  location?: string;

  @ApiProperty({ example: 'Experienced math teacher...', required: false })
  @IsOptional()
  @IsString({ message: 'Bio must be a string' })
  bio?: string;

  @ApiProperty({ example: ['Mathematics', 'Physics'], required: false })
  @IsOptional()
  @IsArray({ message: 'Subjects taught must be an array' })
  @IsString({ each: true, message: 'Each subject must be a string' })
  subjectsTaught?: string[];

  @ApiProperty({ example: ['Grade 9', 'Grade 10'], required: false })
  @IsOptional()
  @IsArray({ message: 'Grade levels must be an array' })
  @IsString({ each: true, message: 'Each grade level must be a string' })
  gradeLevels?: string[];

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsInt({ message: 'Years of experience must be an integer' })
  @Min(0, { message: 'Years of experience cannot be negative' })
  @Max(50, { message: 'Years of experience seems too high' })
  yearsExperience?: number;

  @ApiProperty({ example: 'ABC High School', required: false })
  @IsOptional()
  @IsString({ message: 'Current school must be a string' })
  currentSchool?: string;
}
