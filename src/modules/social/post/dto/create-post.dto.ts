import { IsOptional, IsObject } from 'class-validator';

export class CreatePostDto {
  @IsObject()
  content: Record<string, any>;
}


