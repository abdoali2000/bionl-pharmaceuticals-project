import { IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ReorderImageItemDto } from './reorder-image-item.dto';

export class ReorderImagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderImageItemDto)
  images!: ReorderImageItemDto[];
}
