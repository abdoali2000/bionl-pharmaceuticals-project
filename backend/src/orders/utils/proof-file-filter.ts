import { BadRequestException } from '@nestjs/common';

/**
 * Allowed MIME types for payment proof uploads.
 * Extends image types to also allow PDF bank receipts.
 */
export const ALLOWED_PROOF_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
];

/**
 * Multer file filter that accepts only JPEG, PNG, and PDF files.
 * Used by the order submission endpoint for payment proof uploads.
 */
export const PROOF_FILE_FILTER = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (ALLOWED_PROOF_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        `Invalid file type "${file.mimetype}". Only JPEG, PNG, and PDF are allowed for payment proofs.`,
      ),
      false,
    );
  }
};
