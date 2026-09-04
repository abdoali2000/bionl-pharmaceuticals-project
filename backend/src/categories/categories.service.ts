import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { generateSlug, resolveUniqueSlug } from '../common/utils/slug.util';
import { Category } from '../../generated/prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<{ data: Category[]; meta: { total: number } }> {
    const categories = await this.prisma.category.findMany({
      orderBy: { nameEn: 'asc' },
    });
    return { data: categories, meta: { total: categories.length } };
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const baseSlug = generateSlug(dto.nameEn);
    const slug = await resolveUniqueSlug(baseSlug, async (s) => {
      const existing = await this.prisma.category.findUnique({ where: { slug: s } });
      return !!existing;
    });

    return this.prisma.category.create({
      data: { nameAr: dto.nameAr, nameEn: dto.nameEn, slug },
    });
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    await this.findOneOrFail(id);

    return this.prisma.category.update({
      where: { id },
      // Slug is intentionally never updated
      data: {
        ...(dto.nameAr !== undefined && { nameAr: dto.nameAr }),
        ...(dto.nameEn !== undefined && { nameEn: dto.nameEn }),
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOneOrFail(id);
    // Cascade in schema deletes ProductCategory join records; products are unaffected
    await this.prisma.category.delete({ where: { id } });
  }

  private async findOneOrFail(id: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }
    return category;
  }
}
