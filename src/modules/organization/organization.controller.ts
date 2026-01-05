import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Req,
  UseGuards,
  Param,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-auth.guard';
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getOrganizations(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tab') tab?: 'explore' | 'popular' | 'followed',
    @Query('search') search?: string,
  ) {
    const userId = req.user?.id;
    if (tab === 'followed' && !userId) {
      throw new Error('Login to view followed organizations');
    }

    return this.organizationService.getOrganizations(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      userId,
      tab ?? 'explore',
      search,
    );
  }
  @Get(':id')
  async getOrganizationById(@Param('id') id: string) {
    const organization = await this.organizationService.getOrganizationById(id);
    return {
      data: organization,
    };
  }
}
