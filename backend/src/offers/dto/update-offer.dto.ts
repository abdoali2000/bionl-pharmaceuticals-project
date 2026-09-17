import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Custom validator: if both startDate and endDate are provided in the update,
 * endDate must be strictly after startDate.
 */
@ValidatorConstraint({ name: 'updateEndDateAfterStartDate', async: false })
export class UpdateEndDateAfterStartDateConstraint
  implements ValidatorConstraintInterface
{
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as UpdateOfferDto;
    if (!obj.startDate || !obj.endDate) return true;
    return new Date(obj.endDate) > new Date(obj.startDate);
  }

  defaultMessage(): string {
    return 'endDate must be strictly after startDate';
  }
}

export class UpdateOfferDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  titleAr?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  titleEn?: string;

  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @Validate(UpdateEndDateAfterStartDateConstraint)
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  showInTopBanner?: boolean;
}
