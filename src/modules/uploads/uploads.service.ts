import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Response } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { FileUpload, UploadFolder } from '@prisma/client';
import { handlePrismaError } from '../../common/utils/prisma-error.util';

export interface FileUploadResponse {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  folder: UploadFolder;
  publicUrl: string;
  isDeleted: boolean;
  createdAt: Date;
}

@Injectable()
export class UploadsService {
  private readonly appUrl: string;
  private readonly storageDir: string;
  private readonly trashDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.appUrl = this.configService.get<string>('uploads.appUrl')!;
    this.storageDir = path.resolve(
      process.cwd(),
      this.configService.get<string>('uploads.storageDir')!,
    );
    this.trashDir = path.resolve(
      process.cwd(),
      this.configService.get<string>('uploads.trashDir')!,
    );
  }

  toPublicUrl(id: string): string {
    return `${this.appUrl}/api/uploads/file/${id}`;
  }

  toResponse(record: FileUpload): FileUploadResponse {
    return {
      id: record.id,
      originalName: record.originalName,
      mimeType: record.mimeType,
      size: record.size,
      folder: record.folder,
      publicUrl: this.toPublicUrl(record.id),
      isDeleted: record.isDeleted,
      createdAt: record.createdAt,
    };
  }

  async upload(
    file: Express.Multer.File,
    folder: UploadFolder,
    uploadedById?: string,
  ): Promise<FileUploadResponse> {
    if (!file) {
      throw new InternalServerErrorException('No file provided');
    }

    const ext = path.extname(file.originalname) || '';
    const storedName = `${randomUUID()}${ext}`;
    const relativePath = path.join(folder.toLowerCase(), storedName);
    const absolutePath = path.join(this.storageDir, relativePath);

    try {
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, file.buffer);

      const record = await this.prisma.fileUpload.create({
        data: {
          originalName: file.originalname,
          storedName,
          mimeType: file.mimetype,
          size: file.size,
          folder,
          relativePath,
          uploadedById,
        },
      });

      return this.toResponse(record);
    } catch (error) {
      handlePrismaError(error);
      throw error;
    }
  }

  async findOne(id: string): Promise<FileUpload> {
    const record = await this.prisma.fileUpload.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('File not found');
    return record;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    folder?: UploadFolder;
    isDeleted?: boolean;
    search?: string;
  }) {
    const { page = 1, limit = 20, folder, isDeleted, search } = params;
    const where: any = {};
    if (folder) where.folder = folder;
    if (isDeleted !== undefined) where.isDeleted = isDeleted;
    if (search) where.originalName = { contains: search, mode: 'insensitive' };

    try {
      const [records, total] = await Promise.all([
        this.prisma.fileUpload.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.fileUpload.count({ where }),
      ]);

      return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: records.map((r) => this.toResponse(r)),
      };
    } catch (error) {
      handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Soft-deletes a file: physically moves it into the trash folder (kept for
   * superadmin inspection/recovery) and marks the DB record as deleted.
   */
  async softDelete(
    id: string,
    requester: { id: string; isAdmin: boolean },
  ): Promise<FileUploadResponse> {
    const record = await this.findOne(id);

    if (record.isDeleted) return this.toResponse(record);

    if (
      !requester.isAdmin &&
      record.uploadedById &&
      record.uploadedById !== requester.id
    ) {
      throw new ForbiddenException('You do not own this file');
    }

    const fromPath = path.join(this.storageDir, record.relativePath);
    const trashPath = record.relativePath;
    const toPath = path.join(this.trashDir, trashPath);

    try {
      await fs.mkdir(path.dirname(toPath), { recursive: true });
      await fs.rename(fromPath, toPath);
    } catch {
      // File already missing from disk — proceed with marking it deleted
      // so the DB record stays consistent with reality.
    }

    try {
      const updated = await this.prisma.fileUpload.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date(), trashPath },
      });
      return this.toResponse(updated);
    } catch (error) {
      handlePrismaError(error);
      throw error;
    }
  }

  /**
   * Serves the raw file bytes for a public URL. Deleted files 404 for
   * everyone except admins, who can still inspect trashed files.
   */
  async serve(id: string, res: Response, isAdmin = false): Promise<void> {
    const record = await this.findOne(id);

    if (record.isDeleted && !isAdmin) {
      throw new NotFoundException('File not found');
    }

    const absolutePath = record.isDeleted
      ? path.join(this.trashDir, record.trashPath ?? record.relativePath)
      : path.join(this.storageDir, record.relativePath);

    try {
      const buffer = await fs.readFile(absolutePath);
      res.setHeader('Content-Type', record.mimeType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(record.originalName)}"`,
      );
      res.send(buffer);
    } catch {
      throw new NotFoundException('File not found on disk');
    }
  }
}
