import { Module } from '@nestjs/common';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [IntegrationController],
  providers: [IntegrationService, PrismaService],
})
export class IntegrationModule {}
