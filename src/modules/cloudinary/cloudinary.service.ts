import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  /**
   * Upload a file to Cloudinary
   * @param file Multer file object
   * @param folder folder in Cloudinary
   * @returns object containing file URL and publicId
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'resumes',
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'auto', // PDFs are 'raw', images are 'auto'
          format: file.mimetype === 'application/pdf' ? 'pdf' : undefined,
        },
        (error, result?: UploadApiResponse) => {
          if (error) return reject(new InternalServerErrorException(error.message));
          if (!result) return reject(new InternalServerErrorException('Cloudinary upload failed'));

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        },
      );

      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
    });
  }

  /**
   * Delete a file from Cloudinary
   * @param publicId Cloudinary publicId
   */
  async deleteFile(publicId: string, isPdf: boolean = false): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: isPdf ? 'raw' : 'auto',
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete file from Cloudinary');
    }
  }
}
