import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(2, { message: 'nameAr must be at least 2 characters' })
  @MaxLength(100)
  nameAr!: string;

  @IsString()
  @MinLength(2, { message: 'nameEn must be at least 2 characters' })
  @MaxLength(100)
  nameEn!: string;
}
