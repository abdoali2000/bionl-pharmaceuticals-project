import { IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemInputDto {
  @IsUUID('4', { message: 'productId must be a valid UUID v4' })
  productId!: string;

  @Type(() => Number)
  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity!: number;
}
