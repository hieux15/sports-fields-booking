import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn } from 'class-validator';

export class CourtAvailabilityDto {
  @ApiProperty({
    example: '2026-10-01',
    description: 'Ngày tại múi giờ Việt Nam',
  })
  @IsDateString({ strict: true })
  date!: string;

  @ApiProperty({ example: 90, enum: [60, 90, 120, 180, 240] })
  @Type(() => Number)
  @IsIn([60, 90, 120, 180, 240])
  durationMinutes!: number;
}
