import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
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
 * Custom validator: endDate must be strictly after startDate.
 * Applied at class level so both fields are available.
 */
@ValidatorConstraint({ name: 'endDateAfterStartDate', async: false })
export class EndDateAfterStartDateConstraint
  implements ValidatorConstraintInterface
{
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as CreateOfferDto;
    if (!obj.startDate || !obj.endDate) return true; // let @IsDateString handle nulls
    return new Date(obj.endDate) > new Date(obj.startDate);
  }

  defaultMessage(): string {
    return 'endDate must be strictly after startDate';
  }
}

export class CreateOfferDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  titleAr!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  titleEn!: string;

  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  @Validate(EndDateAfterStartDateConstraint)
  endDate!: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  showInTopBanner?: boolean = false;
}
