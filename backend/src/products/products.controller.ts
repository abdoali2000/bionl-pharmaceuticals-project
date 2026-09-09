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
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// ---------------------------------------------------------------------------
// Multer config — store uploads in memory so we can pipe the buffer to Cloudinary
// ---------------------------------------------------------------------------

const COVER_IMAGE_INTERCEPTOR = FileInterceptor('coverImage', {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          `Invalid file type "${file.mimetype}". Only JPEG, PNG, and WEBP are allowed.`,
        ),
        false,
      );
    }
  },
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
}
