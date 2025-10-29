import { IsString, IsOptional, Length } from 'class-validator';

export class CreateEndorsementDto {

  @IsString()
  endorsedId: string;

  @IsString()
  @Length(1, 100)
  skill: string;

  @IsOptional()
  @IsString()
  message?: string;
}
