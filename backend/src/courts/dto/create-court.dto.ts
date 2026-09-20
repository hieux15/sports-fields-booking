import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateCourtDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsOptional()
  address?: string;

  // HTML number inputs submit strings, so coerce before validating.
  @Type(() => Number)
  @IsNumber()
  @Min(10000)
  @Max(10000000)
  pricePerHour!: number;

  @IsString()
  openTime!: string;

  @IsString()
  closeTime!: string;
}
