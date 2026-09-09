import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  // ── Arabic content ──────────────────────────────────────────────────────────

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  nameAr!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  descriptionAr!: string;

  @IsOptional()
  @IsString()
  ingredientsAr?: string;

  @IsOptional()
  @IsString()
  usageInstructionsAr?: string;

  // ── English content ─────────────────────────────────────────────────────────

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  nameEn!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  descriptionEn!: string;

  @IsOptional()
  @IsString()
  ingredientsEn?: string;

  @IsOptional()
  @IsString()
  usageInstructionsEn?: string;

  // ── Pricing ─────────────────────────────────────────────────────────────────

  /**
   * Comes in as a string from multipart/form-data — @Type converts it to number.
   */
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price!: number;

  // ── Categories ──────────────────────────────────────────────────────────────

  /**
   * The client serialises categoryIds as a JSON string in the multipart body
   * (e.g. `categoryIds=["uuid1","uuid2"]`).
   * The service normalises the raw value into a string[].
   */
  @IsOptional()
  categoryIds?: string | string[];
}
