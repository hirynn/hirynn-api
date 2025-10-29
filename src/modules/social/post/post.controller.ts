import {
  Controller,
  Get,
  Post as HttpPost,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from '././dto/create-post.dto';
import { UpdatePostDto } from '././dto/update-post.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}
  @HttpPost('/')
  create(@Req() req, @Body() dto: CreatePostDto) {
    const authorId = req.user?.id; 
    return this.postService.create(authorId, dto);
  }
  @Get('/')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('authorId') authorId?: string,
  ) {
    return this.postService.findAll(page, limit, { authorId});
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(id);
  }
@Put(':id')
update(@Param('id') id: string, @Body() dto: UpdatePostDto, @Req() req) {
  const userId = req.user?.id;
  return this.postService.update(id, userId, dto);
}

@Delete(':id')
remove(@Param('id') id: string, @Req() req) {
  const userId = req.user?.id; 
  return this.postService.remove(id, userId);
}
}
