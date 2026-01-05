import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactQueryDto } from './dto/create-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, ROLES_KEY } from '../auth/roles.decorator';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // Public
  @Post()
  async create(@Body() dto: CreateContactQueryDto) {
    return {
      message: 'Your query has been submitted successfully',
      data: await this.contactService.create(dto),
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async findAll() {
    return this.contactService.findAll();
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async markAsRead(@Param('id') id: string) {
    return this.contactService.markAsRead(id);
  }
}
