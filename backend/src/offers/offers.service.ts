import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Injectable()
export class OffersService {
  private readonly logger = new Logger(OffersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ---------------------------------------------------------------------------
  // Public queries
  // ---------------------------------------------------------------------------

  /**
   * Returns active offers (startDate <= now <= endDate), ordered by startDate ASC.
   * Strips cloudinaryPublicId from the response.
   */
  async findActive() {
    const now = new Date();

    const offers = await this.prisma.offer.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { startDate: 'asc' },
    });

    return offers.map((offer) => this.stripPublicId(offer));
  }

  /**
   * Returns active offers that are flagged for the top banner,
   * ordered by startDate ASC. Strips cloudinaryPublicId.
   */
  async findActiveBanner() {
    const now = new Date();

    const offers = await this.prisma.offer.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
        showInTopBanner: true,
      },
      orderBy: { startDate: 'asc' },
    });

    return offers.map((offer) => this.stripPublicId(offer));
  }

  // ---------------------------------------------------------------------------
  // Admin queries
  // ---------------------------------------------------------------------------

  /**
   * Returns ALL offers regardless of date range, ordered by startDate DESC.
   * Includes cloudinaryPublicId for admin use.
   */
  async findAll() {
    return this.prisma.offer.findMany({
      orderBy: { startDate: 'desc' },
    });
  }

  // ---------------------------------------------------------------------------
  // Admin mutations
  // ---------------------------------------------------------------------------

  /**
   * Creates a new offer. If an image file is provided, uploads it to
   * Cloudinary under 'bionl/offers' and stores imageUrl + cloudinaryPublicId.
   */
  async create(dto: CreateOfferDto, imageFile?: Express.Multer.File) {
    this.validateDates(dto.startDate, dto.endDate);

    let imageUrl: string | null = null;
    let cloudinaryPublicId: string | null = null;

    if (imageFile) {
      const uploaded = await this.cloudinary.uploadFile(
        imageFile.buffer,
        'bionl/offers',
      );
      imageUrl = uploaded.url;
      cloudinaryPublicId = uploaded.publicId;
    }

    return this.prisma.offer.create({
      data: {
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        descriptionAr: dto.descriptionAr ?? null,
        descriptionEn: dto.descriptionEn ?? null,
        showInTopBanner: dto.showInTopBanner ?? false,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        imageUrl,
        cloudinaryPublicId,
      },
    });
  }

  /**
   * Updates an existing offer.
   * - If a new image file is provided: upload it, delete the old one (if any),
   *   then update imageUrl and cloudinaryPublicId.
   * - If no new image: only update the provided text/date fields.
   * - Always guards against null cloudinaryPublicId before attempting deletion.
   */
  async update(
    id: string,
    dto: UpdateOfferDto,
    imageFile?: Express.Multer.File,
  ) {
    const offer = await this.findOneOrFail(id);

    if (dto.startDate && dto.endDate) {
      this.validateDates(dto.startDate, dto.endDate);
    }

    let imageUrl = offer.imageUrl;
    let cloudinaryPublicId = offer.cloudinaryPublicId;

    if (imageFile) {
      const uploaded = await this.cloudinary.uploadFile(
        imageFile.buffer,
        'bionl/offers',
      );

      if (offer.cloudinaryPublicId) {
        await this.cloudinary.deleteFile(offer.cloudinaryPublicId);
      }

      imageUrl = uploaded.url;
      cloudinaryPublicId = uploaded.publicId;
    }

    return this.prisma.offer.update({
      where: { id },
      data: {
        ...(dto.titleAr !== undefined && { titleAr: dto.titleAr }),
        ...(dto.titleEn !== undefined && { titleEn: dto.titleEn }),
        ...(dto.descriptionAr !== undefined && { descriptionAr: dto.descriptionAr }),
        ...(dto.descriptionEn !== undefined && { descriptionEn: dto.descriptionEn }),
        ...(dto.showInTopBanner !== undefined && { showInTopBanner: dto.showInTopBanner }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        imageUrl,
        cloudinaryPublicId,
      },
    });
  }

  /**
   * Deletes an offer. If cloudinaryPublicId exists, deletes the image from
   * Cloudinary first. Always guards against null before calling deleteFile.
   */
  async remove(id: string) {
    const offer = await this.findOneOrFail(id);

    if (offer.cloudinaryPublicId) {
      await this.cloudinary.deleteFile(offer.cloudinaryPublicId);
    }

    await this.prisma.offer.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async findOneOrFail(id: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id } });
    if (!offer) {
      throw new NotFoundException(`Offer with id "${id}" not found`);
    }
    return offer;
  }

  /** Throws a 400 if endDate is not strictly after startDate. */
  private validateDates(startDate: string, endDate: string) {
    if (new Date(endDate) <= new Date(startDate)) {
      throw new BadRequestException('endDate must be strictly after startDate');
    }
  }

  /** Returns an offer object with cloudinaryPublicId removed. */
  private stripPublicId<T extends { cloudinaryPublicId: string | null }>(
    offer: T,
  ): Omit<T, 'cloudinaryPublicId'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { cloudinaryPublicId, ...publicOffer } = offer;
    return publicOffer;
  }
}
