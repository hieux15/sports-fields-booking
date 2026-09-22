import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    example: 'seed-court-1',
    description: 'ID sân muốn đặt (lấy từ GET /courts)',
  })
  @IsNotEmpty()
  @IsString()
  courtId!: string;

  @ApiProperty({
    example: '2026-10-01T18:00:00.000Z',
    description:
      'Thời điểm bắt đầu (ISO 8601). Thời lượng phải từ 1 đến 4 giờ và nằm trong giờ mở cửa của sân.',
  })
  @IsNotEmpty()
  @IsString()
  startTime!: string;

  @ApiProperty({
    example: '2026-10-01T19:30:00.000Z',
    description: 'Thời điểm kết thúc (ISO 8601), phải sau startTime',
  })
  @IsNotEmpty()
  @IsString()
  endTime!: string;
}
