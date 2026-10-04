import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform, plainToInstance } from 'class-transformer';
import { PaymentMethod } from '../../../generated/prisma/client';
import { OrderItemInputDto } from './order-item-input.dto';

export class CreateOrderDto {
  // ── Customer information ─────────────────────────────────────────────────────

  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  // ── Location ─────────────────────────────────────────────────────────────────

  @IsString()
  @IsNotEmpty()
  governorate!: string;

  @IsString()
  @IsNotEmpty()
  cityOrCenterOrVillage!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  // ── Additional ───────────────────────────────────────────────────────────────

  @IsOptional()
  @IsString()
  notes?: string;

  // ── Payment ──────────────────────────────────────────────────────────────────

  @IsEnum(PaymentMethod, {
    message: `paymentMethod must be one of: ${Object.values(PaymentMethod).join(', ')}`,
  })
  paymentMethod!: PaymentMethod;

  // ── Order items ──────────────────────────────────────────────────────────────

  /**
   * The client sends `items` as a JSON string inside multipart/form-data
   * (e.g. items='[{"productId":"...","quantity":2}]').
   * The @Transform decorator parses the raw string into a typed array before
   * class-validator validates the nested OrderItemInputDto objects.
   */
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value) as unknown;
        if (Array.isArray(parsed)) {
          // Convert each plain object into a typed class instance so that
          // @ValidateNested + forbidNonWhitelisted accepts the properties.
          return plainToInstance(OrderItemInputDto, parsed);
        }
        return parsed;
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray({ message: 'items must be an array' })
  @ArrayMinSize(1, { message: 'At least one order item is required' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];
}
