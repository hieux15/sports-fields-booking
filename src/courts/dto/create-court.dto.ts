import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
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
  @IsNumber()
  @Min(0)
  pricePerHour!: number;
  @IsString()
  openTime!: string;
  @IsString()
  closeTime!: string;
}
