import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Organization, SchoolAdmin, AdminRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminService } from './admin.service';
import { VerifyResponse } from './admin.service';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Patch('organizations/:id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify an organization' })
  @ApiResponse({
    status: 200,
    description: 'Organization verified successfully',
  })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async verifyOrganization(
    @Param('id') id: string,
    @Body() body: { isVerified: boolean },
  ): Promise<VerifyResponse<Organization>> {
    return this.adminService.verifyOrganization(id, body.isVerified);
  }

  @Patch('school-admins/:id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a school admin' })
  @ApiResponse({
    status: 200,
    description: 'School admin verified successfully',
  })
  @ApiResponse({ status: 404, description: 'School admin not found' })
  async verifySchoolAdmin(
    @Param('id') id: string,
    @Body() body: { isVerified: boolean },
  ): Promise<VerifyResponse<SchoolAdmin>> {
    return this.adminService.verifySchoolAdmin(id, body.isVerified);
  }
}
