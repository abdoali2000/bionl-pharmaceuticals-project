import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { PaymentMethod } from '../../../generated/prisma/client';

export class GetOrdersQueryDto {
  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  governorate?: string;

  @IsOptional()
  @IsEnum(PaymentMethod, {
    message: `paymentMethod must be one of: ${Object.values(PaymentMethod).join(', ')}`,
  })
  paymentMethod?: PaymentMethod;

  /**
   * ISO 8601 date string — lower bound for createdAt.
   * When provided alone, filters from this date to now.
   */
  @IsOptional()
  @IsDateString({}, { message: 'dateFrom must be a valid ISO 8601 date string' })
  dateFrom?: string;

  /**
   * ISO 8601 date string — upper bound for createdAt.
   * When provided alone, filters from the beginning of time to this date.
   */
  @IsOptional()
  @IsDateString({}, { message: 'dateTo must be a valid ISO 8601 date string' })
  dateTo?: string;
}
