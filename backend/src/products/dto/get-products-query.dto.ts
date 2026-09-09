import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class GetProductsQueryDto {
  /** Filter by category slug (e.g. ?category=derma) */
  @IsOptional()
  @IsString()
  category?: string;

  /** Partial, case-insensitive search on nameAr and nameEn */
  @IsOptional()
  @IsString()
  search?: string;

  /** Filter products with price >= minPrice */
  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  /** Filter products with price <= maxPrice */
  @IsOptional()
  @IsNumberString()
  maxPrice?: string;
}
