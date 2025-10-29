import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeDto, LikeQueryDto } from './dto/like.dto';
//import { RolesGuard } from '../../auth/guards/roles.guard';
//import { Roles } from '../../auth/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@Controller('likes')
export class LikeController {
  constructor(private likeService: LikeService) {}
  @Post(':postId/toggle')
  async toggle(@Req() req, @Param('postId') postId: string) {
    const userId = req.user?.id; // retrieved from auth middleware (JWT or session)
    return this.likeService.toggleLike(userId, postId);
  }
 

@Get('/')
findAll(@Req() req, @Query() query: LikeQueryDto) {
  const userId = req.user?.id; 
  return this.likeService.findAll(userId, query);
}

}
