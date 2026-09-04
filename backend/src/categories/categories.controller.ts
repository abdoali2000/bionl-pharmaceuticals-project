import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /** GET /api/categories — Public */
  @Get('categories')
  async findAll() {
    const result = await this.categoriesService.findAll();
    return {
      message: 'Categories retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  /** POST /api/admin/categories — Auth required */
  @Post('admin/categories')
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateCategoryDto) {
    const category = await this.categoriesService.create(dto);
    return {
      message: 'Category created successfully',
      data: category,
      meta: null,
    };
  }

  /** PATCH /api/admin/categories/:id — Auth required */
  @Patch('admin/categories/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.update(id, dto);
    return {
      message: 'Category updated successfully',
      data: category,
      meta: null,
    };
  }

  /** DELETE /api/admin/categories/:id — Auth required */
  @Delete('admin/categories/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.categoriesService.remove(id);
    return {
      message: 'Category deleted successfully',
      data: null,
      meta: null,
    };
  }
}
