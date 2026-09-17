import { BadRequestException } from '@nestjs/common';

/**
 * Allowed MIME types for image uploads across all modules.
 */
export const ALLOWED_IMAGE_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Multer file filter that rejects any file whose MIME type is not in
 * ALLOWED_IMAGE_MIMETYPES. Safe to share across ProductsController and
 * OffersController.
 */
export const IMAGE_FILE_FILTER = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (ALLOWED_IMAGE_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        `Invalid file type "${file.mimetype}". Only JPEG, PNG, and WEBP are allowed.`,
      ),
      false,
    );
  }
};
