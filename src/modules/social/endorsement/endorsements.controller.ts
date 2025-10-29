import { Controller, Post, Get, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { EndorsementsService } from './endorsements.service';
import { CreateEndorsementDto } from './dto/create-endorsement.dto';
import { QueryEndorsementDto } from './dto/query-endorsement.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('endorsements')
export class EndorsementsController {
  constructor(private readonly endorsementsService: EndorsementsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateEndorsementDto, @Req() req: any) {
    const endorserId = req.user?.id; 
    return this.endorsementsService.create(endorserId, dto);
  }

 @Get('me/received')
findReceivedForSelf(@Req() req: any, @Query() query: QueryEndorsementDto) {
  const userId = req.user?.id; 
  return this.endorsementsService.findReceivedForSelf(userId, query);
}
@Get('me/given')
findGivenForSelf(@Req() req: any, @Query() query: QueryEndorsementDto) {
  const userId = req.user?.id;
  return this.endorsementsService.findGivenForSelf(userId, query);
}
  @Get(':teacherId/given')
  findGiven(@Param('teacherId') teacherId: string, @Query() query: QueryEndorsementDto) {
    return this.endorsementsService.findGiven(teacherId, query);
  }
@Get('me/skills')
findMySkillCounts(@Req() req: any) {
  const userId = req.user?.id; 
  return this.endorsementsService.findSkillCounts(userId);
}
  @Get(':teacherId/skills')
  findSkillCounts(@Param('teacherId') teacherId: string) {
    return this.endorsementsService.findSkillCounts(teacherId);
  }

  @Get(':teacherId/skills/:skill')
  findEndorsersForSkill(@Param('teacherId') teacherId: string, @Param('skill') skill: string) {
    return this.endorsementsService.findEndorsersForSkill(teacherId, skill);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.endorsementsService.remove(id, userId);
  }
}

