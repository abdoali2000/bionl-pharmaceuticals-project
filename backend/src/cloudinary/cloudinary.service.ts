import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Uploads a file buffer to Cloudinary.
   * @param buffer - The file buffer to upload
   * @param folder - The Cloudinary folder path (e.g. 'bionl/products/covers')
   * @returns Object containing the CDN url and publicId
   */
  async uploadFile(
    buffer: Buffer,
    folder: string,
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder, resource_type: 'auto' }, (error, result) => {
          if (error || !result) {
            this.logger.error('Cloudinary upload failed', error);
            return reject(
              new InternalServerErrorException('Failed to upload file to CDN'),
            );
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        })
        .end(buffer);
    });
  }

  /**
   * Deletes a file from Cloudinary by its public_id.
   * Errors are logged but not thrown — callers should handle partial failures.
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      this.logger.error(`Failed to delete Cloudinary asset: ${publicId}`, error);
    }
  }
}
