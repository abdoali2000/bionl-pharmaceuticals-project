import {
  IsString,
  IsOptional,
  MinLength,
  IsNumber,
  IsPositive,
  IsArray,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  // ── Arabic content (all optional) ───────────────────────────────────────────

  @IsOptional()
  @IsString()
  @MinLength(2)
  nameAr?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  descriptionAr?: string;

  @IsOptional()
  @IsString()
  ingredientsAr?: string;

  @IsOptional()
  @IsString()
  usageInstructionsAr?: string;

  // ── English content (all optional) ──────────────────────────────────────────

  @IsOptional()
  @IsString()
  @MinLength(2)
  nameEn?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  ingredientsEn?: string;

  @IsOptional()
  @IsString()
  usageInstructionsEn?: string;

  // ── Pricing ─────────────────────────────────────────────────────────────────

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price?: number;

  // ── Categories ──────────────────────────────────────────────────────────────

  /**
   * When provided, fully replaces the product's category associations.
   * An empty array removes all associations.
   */
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];
}
