import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}
  @Post()
  create(@Body() dto: CreateCommentDto, @Req() req) {
    const authorId = req.user?.id;
    if (!authorId) throw new UnauthorizedException('User not authenticated');

    return this.commentsService.create(dto, authorId);
  }

  @Get('post/:postId')
  findAll(
    @Param('postId') postId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Req() req,
  ) {
    const authorId = req.user?.id;
    return this.commentsService.findAll(postId, authorId, +page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    const userId = req.user?.id;
    return this.commentsService.findOne(id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCommentDto, @Req() req) {
    const userId = req.user?.id;
    return this.commentsService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const userId = req.user?.id;
    return this.commentsService.remove(id, userId);
  }
}
