import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { generateSlug, resolveUniqueSlug } from '../common/utils/slug.util';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';

// ---------------------------------------------------------------------------
// Shared Prisma include clause — used by every "full product" query
// ---------------------------------------------------------------------------

const PRODUCT_INCLUDE_BASE = {
  categories: {
    select: {
      category: {
        select: { id: true, slug: true, nameAr: true, nameEn: true },
      },
    },
  },
  images: {
    orderBy: { displayOrder: 'asc' as const },
    select: {
      id: true,
      imageUrl: true,
      cloudinaryPublicId: true,
      displayOrder: true,
    },
  },
} satisfies Prisma.ProductInclude;

// ---------------------------------------------------------------------------
// Response mappers
// ---------------------------------------------------------------------------

/** Flatten the nested ProductCategory relation into a plain category array */
function mapCategories(
  categories: Array<{ category: { id: string; slug: string; nameAr: string; nameEn: string } }>,
) {
  return categories.map((pc) => pc.category);
}

/**
 * Admin view — includes cloudinaryPublicId on both the product and images.
 */
function toAdminProduct(product: any) {
  return {
    ...product,
    categories: mapCategories(product.categories),
  };
}

/**
 * Public view — strips all cloudinaryPublicId fields before returning.
 */
function toPublicProduct(product: any) {
  const { coverImagePublicId, ...rest } = product;
  return {
    ...rest,
    categories: mapCategories(product.categories),
    images: product.images.map(
      ({ cloudinaryPublicId, ...img }: any) => img,
    ),
  };
}

// ---------------------------------------------------------------------------
// Helper: parse categoryIds from multipart (JSON string or string array)
// ---------------------------------------------------------------------------

function parseCategoryIds(raw: string | string[] | undefined): string[] {
  if (raw === undefined || raw === null) return [];

  // Repeated form fields → already an array
  if (Array.isArray(raw)) return raw;

  // Single string that may be JSON-encoded array
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as string[];
    } catch {
      // fall-through to single-value handling
    }
  }

  // Plain single UUID string
  return raw.length > 0 ? [raw] : [];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ── List (shared public + admin) ────────────────────────────────────────────

  async findAll(
    query: GetProductsQueryDto,
    includePrivateFields: boolean,
  ): Promise<{ data: any[]; meta: { total: number } }> {
    const where: Prisma.ProductWhereInput = {};

    if (query.category) {
      where.categories = {
        some: { category: { slug: query.category } },
      };
    }

    if (query.search) {
      where.OR = [
        { nameAr: { contains: query.search, mode: 'insensitive' } },
        { nameEn: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.minPrice !== undefined) {
      where.price = { ...((where.price as object) ?? {}), gte: query.minPrice };
    }

    if (query.maxPrice !== undefined) {
      where.price = { ...((where.price as object) ?? {}), lte: query.maxPrice };
    }

    const products = await this.prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE_BASE,
      orderBy: { createdAt: 'desc' },
    });

    const mapped = includePrivateFields
      ? products.map(toAdminProduct)
      : products.map(toPublicProduct);

    return { data: mapped, meta: { total: mapped.length } };
  }

  // ── Single (admin — by UUID) ─────────────────────────────────────────────────

  async findOneAdminById(id: string): Promise<any> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE_BASE,
    });

    if (!product) throw new NotFoundException(`Product with id "${id}" not found`);

    return toAdminProduct(product);
  }

  // ── Single (public — by slug) ────────────────────────────────────────────────

  async findOnePublicBySlug(slug: string): Promise<any> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: PRODUCT_INCLUDE_BASE,
    });

    if (!product) throw new NotFoundException(`Product with slug "${slug}" not found`);

    // Related products: up to 4 products sharing at least one category
    const categoryIds = product.categories.map((pc) => pc.category.id);
    const related = categoryIds.length > 0
      ? await this.prisma.product.findMany({
          where: {
            id: { not: product.id },
            categories: { some: { categoryId: { in: categoryIds } } },
          },
          take: 4,
          select: {
            id: true,
            slug: true,
            nameAr: true,
            nameEn: true,
            price: true,
            coverImageUrl: true,
          },
        })
      : [];

    return {
      ...toPublicProduct(product),
      relatedProducts: related,
    };
  }

  // ── Create ───────────────────────────────────────────────────────────────────

  async create(dto: CreateProductDto, coverImageFile: Express.Multer.File): Promise<any> {
    // Validate cover image presence (guard also checked in controller, but defensive)
    if (!coverImageFile) {
      throw new BadRequestException('Cover image is required');
    }

    // Parse and validate categoryIds
    const categoryIds = parseCategoryIds(dto.categoryIds);
    await this.validateCategoryIds(categoryIds);

    // Generate unique slug from nameEn
    const baseSlug = generateSlug(dto.nameEn);
    const slug = await resolveUniqueSlug(baseSlug, async (s) => {
      const existing = await this.prisma.product.findUnique({ where: { slug: s } });
      return !!existing;
    });

    // Upload cover image to Cloudinary
    const { url: coverImageUrl, publicId: coverImagePublicId } =
      await this.cloudinary.uploadFile(coverImageFile.buffer, 'bionl/products/covers');

    // Create product + category associations in a single transaction
    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          slug,
          nameAr: dto.nameAr,
          descriptionAr: dto.descriptionAr,
          ingredientsAr: dto.ingredientsAr ?? null,
          usageInstructionsAr: dto.usageInstructionsAr ?? null,
          nameEn: dto.nameEn,
          descriptionEn: dto.descriptionEn,
          ingredientsEn: dto.ingredientsEn ?? null,
          usageInstructionsEn: dto.usageInstructionsEn ?? null,
          price: dto.price,
          coverImageUrl,
          coverImagePublicId,
          categories: {
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
        },
        include: PRODUCT_INCLUDE_BASE,
      });

      return created;
    });

    return toAdminProduct(product);
  }

  // ── Update (text + categories only — no images) ──────────────────────────────

  async update(id: string, dto: UpdateProductDto): Promise<any> {
    // Ensure product exists
    await this.findProductOrFail(id);

    // Build the scalar update payload — only include fields that were provided
    const data: Prisma.ProductUpdateInput = {};

    if (dto.nameAr !== undefined) data.nameAr = dto.nameAr;
    if (dto.descriptionAr !== undefined) data.descriptionAr = dto.descriptionAr;
    if (dto.ingredientsAr !== undefined) data.ingredientsAr = dto.ingredientsAr;
    if (dto.usageInstructionsAr !== undefined) data.usageInstructionsAr = dto.usageInstructionsAr;
    if (dto.nameEn !== undefined) data.nameEn = dto.nameEn; // slug intentionally NOT regenerated
    if (dto.descriptionEn !== undefined) data.descriptionEn = dto.descriptionEn;
    if (dto.ingredientsEn !== undefined) data.ingredientsEn = dto.ingredientsEn;
    if (dto.usageInstructionsEn !== undefined) data.usageInstructionsEn = dto.usageInstructionsEn;
    if (dto.price !== undefined) data.price = dto.price;

    // Replace category associations if categoryIds was provided
    if (dto.categoryIds !== undefined) {
      await this.validateCategoryIds(dto.categoryIds);
      data.categories = {
        deleteMany: {},
        create: dto.categoryIds.map((categoryId) => ({ categoryId })),
      };
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data,
      include: PRODUCT_INCLUDE_BASE,
    });

    return toAdminProduct(updated);
  }

  // ── Delete (full cascade + Cloudinary cleanup) ───────────────────────────────

  async remove(id: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { images: { select: { cloudinaryPublicId: true } } },
    });

    if (!product) throw new NotFoundException(`Product with id "${id}" not found`);

    // Delete all gallery images from Cloudinary first (failures are logged, not thrown)
    for (const image of product.images) {
      await this.cloudinary.deleteFile(image.cloudinaryPublicId);
    }

    // Delete cover image from Cloudinary (failure is logged, not thrown)
    await this.cloudinary.deleteFile(product.coverImagePublicId);

    // Prisma cascade handles:
    //   • ProductImage records (onDelete: Cascade)
    //   • ProductCategory join records (onDelete: Cascade)
    //   • OrderItem.productId → SET NULL (onDelete: SetNull)
    await this.prisma.product.delete({ where: { id } });
  }

  // ── Replace cover image (EP-03-04) ──────────────────────────────────────────

  /**
   * Replaces the cover image for a product.
   *
   * Order of operations (CRITICAL):
   *   1. Upload the new image to Cloudinary. If this fails, throw immediately —
   *      the old image is untouched and the DB is never updated.
   *   2. Attempt to delete the old image from Cloudinary. If this fails, log
   *      the error but do NOT throw — the new image is valid and must be saved.
   *   3. Update coverImageUrl and coverImagePublicId in the database.
   */
  async replaceCoverImage(
    id: string,
    file: Express.Multer.File,
  ): Promise<{ coverImageUrl: string; coverImagePublicId: string }> {
    const product = await this.findProductOrFail(id);

    // Step 1: Upload new image — failure aborts the entire operation.
    const { url: newUrl, publicId: newPublicId } = await this.cloudinary.uploadFile(
      file.buffer,
      'bionl/products/covers',
    );

    // Step 2: Delete old image — failure is logged but does not block the update.
    try {
      await this.cloudinary.deleteFile(product.coverImagePublicId);
    } catch (error) {
      this.logger.error(
        `Failed to delete old cover image from Cloudinary (publicId: ${product.coverImagePublicId}). ` +
          'The new image was uploaded successfully. Proceeding with DB update. ' +
          'The old asset may need manual cleanup.',
        error,
      );
    }

    // Step 3: Persist the new image details.
    const updated = await this.prisma.product.update({
      where: { id },
      data: { coverImageUrl: newUrl, coverImagePublicId: newPublicId },
    });

    return {
      coverImageUrl: updated.coverImageUrl,
      coverImagePublicId: updated.coverImagePublicId,
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /** Throws 404 if product does not exist — used as an existence guard. */
  private async findProductOrFail(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product with id "${id}" not found`);
    return product;
  }

  /**
   * Validates that every UUID in the array references an existing Category.
   * Throws 400 with the list of invalid IDs if any are not found.
   */
  private async validateCategoryIds(categoryIds: string[]): Promise<void> {
    if (categoryIds.length === 0) return;

    const found = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true },
    });

    const foundIds = new Set(found.map((c) => c.id));
    const invalidIds = categoryIds.filter((id) => !foundIds.has(id));

    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid category IDs: ${invalidIds.join(', ')}`,
      );
    }
  }
}
