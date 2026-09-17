import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsString()
  courtId!: string;

  @IsNotEmpty()
  @IsString()
  startTime!: string;

  @IsNotEmpty()
  @IsString()
  endTime!: string;
}
