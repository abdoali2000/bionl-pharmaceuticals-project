import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean, IsBooleanString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateContactMessageDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  phoneNumber!: string;

  @IsEmail()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  email?: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  subject!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  message!: string;
}
