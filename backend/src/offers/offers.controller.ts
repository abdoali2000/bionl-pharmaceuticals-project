import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IMAGE_FILE_FILTER } from '../common/utils/multer.config';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OffersService } from './offers.service';

// ---------------------------------------------------------------------------
// Multer interceptor — shared IMAGE_FILE_FILTER from Option B refactor
// ---------------------------------------------------------------------------
const OFFER_IMAGE_INTERCEPTOR = FileInterceptor('image', {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: IMAGE_FILE_FILTER,
});

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@Controller()
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  // ── Public endpoints ───────────────────────────────────────────────────────

  /**
   * GET /offers
   * Returns active offers (startDate <= now <= endDate), ordered by startDate ASC.
   * Excludes cloudinaryPublicId from the response.
   */
  @Get('offers')
  async findActive() {
    const offers = await this.offersService.findActive();
    return {
      message: 'Active offers retrieved successfully',
      data: offers,
      meta: { total: offers.length },
    };
  }

  /**
   * GET /offers/banner
   * Returns active offers where showInTopBanner = true, ordered by startDate ASC.
   * Excludes cloudinaryPublicId from the response.
   */
  @Get('offers/banner')
  async findBanner() {
    const offers = await this.offersService.findActiveBanner();
    return {
      message: 'Banner offers retrieved successfully',
      data: offers,
      meta: { total: offers.length },
    };
  }

  // ── Admin endpoints ────────────────────────────────────────────────────────

  /**
   * GET /admin/offers
   * Returns ALL offers regardless of dates, ordered by startDate DESC.
   * Includes all fields (cloudinaryPublicId visible to admin).
   */
  @Get('admin/offers')
  @UseGuards(JwtAuthGuard)
  async findAll() {
    const offers = await this.offersService.findAll();
    return {
      message: 'Offers retrieved successfully',
      data: offers,
      meta: { total: offers.length },
    };
  }

  /**
   * POST /admin/offers
   * Create an offer. Accepts multipart/form-data.
   * Optional 'image' file is uploaded to Cloudinary 'bionl/offers'.
   */
  @Post('admin/offers')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(OFFER_IMAGE_INTERCEPTOR)
  async create(
    @Body() dto: CreateOfferDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const offer = await this.offersService.create(dto, image);
    return {
      message: 'Offer created successfully',
      data: offer,
      meta: null,
    };
  }

  /**
   * PATCH /admin/offers/:id
   * Update an offer. Accepts multipart/form-data.
   * If a new 'image' file is provided, replaces the old Cloudinary image.
   * If no image is provided, only text/date fields are updated.
   */
  @Patch('admin/offers/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(OFFER_IMAGE_INTERCEPTOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOfferDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const offer = await this.offersService.update(id, dto, image);
    return {
      message: 'Offer updated successfully',
      data: offer,
      meta: null,
    };
  }

  /**
   * DELETE /admin/offers/:id
   * Delete an offer and its Cloudinary image (if cloudinaryPublicId exists).
   */
  @Delete('admin/offers/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.offersService.remove(id);
    return {
      message: 'Offer deleted successfully',
      data: null,
      meta: null,
    };
  }
}
