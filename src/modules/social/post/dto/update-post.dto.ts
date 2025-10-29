import { IsOptional, IsObject } from 'class-validator';

export class UpdatePostDto {
  @IsObject()
  @IsOptional()
  content?: Record<string, any>; // Explicit object type
}