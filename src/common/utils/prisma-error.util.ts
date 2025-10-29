import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  RequestTimeoutException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * Global Prisma error handler for PostgreSQL
 */
export function handlePrismaError(err: any) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2000':
        throw new BadRequestException(
          'The provided value is too long for one of the database fields.',
        );

      case 'P2001':
        throw new NotFoundException(
          'The requested record does not exist in the database.',
        );

      case 'P2002':
        throw new ConflictException(
          'A record with this unique field already exists (duplicate entry).',
        );

      case 'P2003':
        throw new BadRequestException(
          'Invalid foreign key reference — related record not found.',
        );

      case 'P2004':
        throw new BadRequestException(
          'A database constraint was violated (check, unique, or foreign key).',
        );

      case 'P2005':
        throw new BadRequestException(
          'Invalid value type provided for one of the fields.',
        );

      case 'P2006':
        throw new BadRequestException(
          'Invalid value provided for a field according to its data type.',
        );

      case 'P2007':
        throw new BadRequestException(
          'Data validation failed — possibly due to an invalid enum or constraint.',
        );

      case 'P2008':
        throw new BadRequestException('Failed to parse database query.');

      case 'P2009':
        throw new BadRequestException(
          'Query validation failed — it violates Prisma schema rules.',
        );

      case 'P2010':
        throw new BadRequestException(
          'Raw query failed — check your SQL syntax or parameters.',
        );

      case 'P2011':
        throw new BadRequestException(
          'A required field was missing or null when it should not be.',
        );

      case 'P2012':
        throw new BadRequestException(
          'A required field for this operation was not provided.',
        );

      case 'P2013':
        throw new BadRequestException(
          'A required argument for the query or mutation is missing.',
        );

      case 'P2014':
        throw new BadRequestException(
          'Invalid relation reference — nested relation is not valid.',
        );

      case 'P2015':
        throw new NotFoundException(
          'Related record not found — cannot complete relation operation.',
        );

      case 'P2016':
        throw new BadRequestException(
          'Query interpretation error — invalid logic or structure.',
        );

      case 'P2017':
        throw new BadRequestException(
          'The records you tried to connect or disconnect are not connected.',
        );

      case 'P2018':
        throw new NotFoundException(
          'Required connected records were not found in the database.',
        );

      case 'P2019':
        throw new BadRequestException(
          'Input error — invalid data type or filter in query.',
        );

      case 'P2020':
        throw new BadRequestException(
          'The value provided is out of range for the field type.',
        );

      case 'P2021':
        throw new NotFoundException(
          'The table specified in the Prisma schema was not found in the database.',
        );

      case 'P2022':
        throw new NotFoundException(
          'A column specified in the Prisma schema does not exist in the database.',
        );

      case 'P2023':
        throw new InternalServerErrorException(
          'Inconsistent or corrupted data detected in the database.',
        );

      case 'P2024':
        throw new RequestTimeoutException(
          'Database operation timed out — the connection may be slow or unavailable.',
        );

      case 'P2025':
        throw new NotFoundException(
          'The record to update or delete does not exist.',
        );

      case 'P2033':
        throw new BadRequestException(
          'Invalid argument value provided in query or mutation.',
        );

      case 'P2034':
        throw new BadRequestException(
          'Transaction error — attempted operation on a closed transaction.',
        );

      default:
        throw new InternalServerErrorException(
          `Unhandled Prisma error (${err.code}): ${err.message}`,
        );
    }
  }

  // Re-throw non-Prisma errors
  throw err;
}
