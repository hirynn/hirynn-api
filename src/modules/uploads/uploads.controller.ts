import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { UploadFolder } from '@prisma/client';
import { UploadsService } from './uploads.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-auth.guard';

const IMAGE_FOLDERS: UploadFolder[] = [
  UploadFolder.PROFILE_PHOTOS,
  UploadFolder.ORGANIZATION_LOGOS,
  UploadFolder.ORGANIZATION_BANNERS,
];

const FILE_FOLDERS: UploadFolder[] = [
  UploadFolder.RESUMES,
  UploadFolder.LISENCES,
  UploadFolder.ANONYMOUS_RESUMES,
  UploadFolder.CV_SUBMISSIONS,
  UploadFolder.MISC,
];

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('images')
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Body() dto: UploadFileDto,
    @Req() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /(image\/jpeg|image\/png|image\/gif|image\/webp)$/i,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!IMAGE_FOLDERS.includes(dto.folder)) {
      throw new BadRequestException(
        `folder must be one of: ${IMAGE_FOLDERS.join(', ')}`,
      );
    }
    return this.uploadsService.upload(file, dto.folder, req.user?.id);
  }

  @Post('files')
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Body() dto: UploadFileDto,
    @Req() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType:
              /(pdf|doc|docx|application\/pdf|application\/msword|application\/vnd.openxmlformats-officedocument.wordprocessingml.document)$/i,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!FILE_FOLDERS.includes(dto.folder)) {
      throw new BadRequestException(
        `folder must be one of: ${FILE_FOLDERS.join(', ')}`,
      );
    }
    return this.uploadsService.upload(file, dto.folder, req.user?.id);
  }

  @Get('file/:id')
  async serveFile(@Param('id') id: string, @Res() res: Response) {
    return this.uploadsService.serve(id, res, false);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('admin/file/:id')
  async serveFileAsAdmin(@Param('id') id: string, @Res() res: Response) {
    return this.uploadsService.serve(id, res, true);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('folder') folder?: UploadFolder,
    @Query('isDeleted') isDeleted?: string,
    @Query('search') search?: string,
  ) {
    return this.uploadsService.findAll({
      page: Number(page),
      limit: Number(limit),
      folder,
      isDeleted: isDeleted !== undefined ? isDeleted === 'true' : undefined,
      search,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('trash')
  async findTrash(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.uploadsService.findAll({
      page: Number(page),
      limit: Number(limit),
      isDeleted: true,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const record = await this.uploadsService.findOne(id);
    return this.uploadsService.toResponse(record);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.uploadsService.softDelete(id, {
      id: req.user.id,
      isAdmin: req.user.userType === 'ADMIN',
    });
  }
}
