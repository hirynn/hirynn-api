import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Organization, SchoolAdmin } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface VerifyResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async verifyOrganization(
    id: string,
    isVerified: boolean,
  ): Promise<VerifyResponse<Organization>> {
    try {
      const organization = await this.prisma.organization.update({
        where: { id },
        data: { isVerified },
      });
      this.logger.log(`Organization ${id} verified: ${isVerified}`);
      return {
        success: true,
        message: `Organization ${isVerified ? 'verified' : 'unverified'} successfully`,
        data: organization,
      };
    } catch {
      throw new NotFoundException(`Organization with id ${id} not found`);
    }
  }

  async verifySchoolAdmin(
    id: string,
    isVerified: boolean,
  ): Promise<VerifyResponse<SchoolAdmin>> {
    try {
      const schoolAdmin = await this.prisma.schoolAdmin.update({
        where: { id },
        data: { isVerified },
      });
      this.logger.log(`School admin ${id} verified: ${isVerified}`);
      return {
        success: true,
        message: `School admin ${isVerified ? 'verified' : 'unverified'} successfully`,
        data: schoolAdmin,
      };
    } catch {
      throw new NotFoundException(`School admin with id ${id} not found`);
    }
  }
}
