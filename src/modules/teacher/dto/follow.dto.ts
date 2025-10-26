import { IsString, IsEnum } from 'class-validator';
import { FollowType } from '@prisma/client';

export class FollowDto {
  @IsString()
  followingId: string;

  @IsEnum(FollowType)
  followingType: FollowType;
}
