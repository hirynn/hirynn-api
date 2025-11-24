import { PartialType } from '@nestjs/mapped-types';
import { CreateJobOrganizationDto } from './create-job-organization.dto';

export class UpdateJobOrganizationDto extends PartialType(CreateJobOrganizationDto) {}
