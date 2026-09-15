import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// ---------------------------------------------------------------------------
// Multer config — store uploads in memory so we can pipe the buffer to Cloudinary
// ---------------------------------------------------------------------------

const ALLOWED_IMAGE_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_FILE_FILTER = (
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

const COVER_IMAGE_INTERCEPTOR = FileInterceptor('coverImage', {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: IMAGE_FILE_FILTER,
});

/** Gallery upload: accepts up to 10 files in the "images" field */
const GALLERY_IMAGES_INTERCEPTOR = FilesInterceptor('images', 10, {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: IMAGE_FILE_FILTER,
});

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ── Public endpoints ─────────────────────────────────────────────────────────

  /**
   * GET /api/products
   * Public product listing with optional filters.
   */
  @Get('products')
  async findAllPublic(@Query() query: GetProductsQueryDto) {
    const result = await this.productsService.findAll(query, false);
    return {
      message: 'Products retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  /**
   * GET /api/products/:slug
   * Public single-product detail by SEO slug.
   */
  @Get('products/:slug')
  async findOnePublic(@Param('slug') slug: string) {
    const product = await this.productsService.findOnePublicBySlug(slug);
    return {
      message: 'Product retrieved successfully',
      data: product,
      meta: null,
    };
  }

  // ── Admin endpoints ──────────────────────────────────────────────────────────

  /**
   * GET /api/admin/products
   * Admin product listing — same filters, includes coverImagePublicId.
   */
  @Get('admin/products')
  @UseGuards(JwtAuthGuard)
  async findAllAdmin(@Query() query: GetProductsQueryDto) {
    const result = await this.productsService.findAll(query, true);
    return {
      message: 'Products retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  /**
   * GET /api/admin/products/:id
   * Admin single-product detail by UUID.
   */
  @Get('admin/products/:id')
  @UseGuards(JwtAuthGuard)
  async findOneAdmin(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.productsService.findOneAdminById(id);
    return {
      message: 'Product retrieved successfully',
      data: product,
      meta: null,
    };
  }

  /**
   * POST /api/admin/products
   * Create a product. Accepts multipart/form-data: text fields + mandatory coverImage file.
   */
  @Post('admin/products')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(COVER_IMAGE_INTERCEPTOR)
  async create(
    @Body() dto: CreateProductDto,
    @UploadedFile() coverImage: Express.Multer.File,
  ) {
    if (!coverImage) {
      throw new BadRequestException(
        'Cover image is required. Send a valid JPEG, PNG, or WEBP file in the "coverImage" field.',
      );
    }

    const product = await this.productsService.create(dto, coverImage);
    return {
      message: 'Product created successfully',
      data: product,
      meta: null,
    };
  }

  /**
   * PATCH /api/admin/products/:id
   * Update text fields and/or category associations.
   * Content-Type: application/json — images are handled in separate endpoints (EP-03-03, EP-03-04).
   */
  @Patch('admin/products/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.productsService.update(id, dto);
    return {
      message: 'Product updated successfully',
      data: product,
      meta: null,
    };
  }

  /**
   * PATCH /api/admin/products/:id/cover-image
   * Replace the cover image for an existing product (EP-03-04).
   * Accepts multipart/form-data with a single `coverImage` file field.
   * Logic: upload new → soft-delete old → update DB.
   */
  @Patch('admin/products/:id/cover-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(COVER_IMAGE_INTERCEPTOR)
  async replaceCoverImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() coverImage: Express.Multer.File,
  ) {
    if (!coverImage) {
      throw new BadRequestException(
        'Cover image is required. Send a valid JPEG, PNG, or WEBP file in the "coverImage" field.',
      );
    }

    const result = await this.productsService.replaceCoverImage(id, coverImage);
    return {
      message: 'Cover image replaced successfully',
      data: result,
      meta: null,
    };
  }

  /**
   * DELETE /api/admin/products/:id
   * Delete a product along with all gallery images and cover image from Cloudinary.
   */
  @Delete('admin/products/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.productsService.remove(id);
    return {
      message: 'Product deleted successfully',
      data: null,
      meta: null,
    };
  }

  // ── Gallery image sub-resource endpoints (EP-03-03) ──────────────────────────

  /**
   * POST /api/admin/products/:id/images
   * Upload one or more gallery images for a product (max 10, 5 MB each).
   * Appends new images after the current highest displayOrder.
   */
  @Post('admin/products/:id/images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(GALLERY_IMAGES_INTERCEPTOR)
  async addGalleryImages(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'At least one image file is required in the "images" field.',
      );
    }

    const images = await this.productsService.addGalleryImages(id, files);
    return {
      message: 'Gallery images uploaded successfully',
      data: images,
      meta: null,
    };
  }

  /**
   * DELETE /api/admin/products/:id/images/:imageId
   * Remove a single gallery image. Returns 400 if the image does not belong to this product.
   */
  @Delete('admin/products/:id/images/:imageId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteGalleryImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    await this.productsService.deleteGalleryImage(id, imageId);
    return {
      message: 'Gallery image deleted successfully',
      data: null,
      meta: null,
    };
  }

  /**
   * PATCH /api/admin/products/:id/images/reorder
   * Atomically update the displayOrder for every image in the provided list.
   * All image IDs must belong to this product or a 400 is returned.
   */
  @Patch('admin/products/:id/images/reorder')
  @UseGuards(JwtAuthGuard)
  async reorderGalleryImages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderImagesDto,
  ) {
    const images = await this.productsService.reorderGalleryImages(id, dto.images);
    return {
      message: 'Gallery images reordered successfully',
      data: images,
      meta: null,
    };
  }
}
