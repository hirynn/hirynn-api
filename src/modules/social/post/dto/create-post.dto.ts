import { IsOptional, IsObject, IsString } from 'class-validator';

export class CreatePostDto {
  @IsObject()
  content: Record<string, any>;

  @IsOptional()
  @IsString()
  organizationId?: string;
}


