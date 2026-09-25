import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CourtAvailabilityDto } from './dto/court-availability.dto';

@ApiTags('Courts')
@Controller('courts')
export class CourtAvailabilityController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get(':id/availability')
  @ApiOperation({
    summary: 'Các khung giờ còn trống của sân theo ngày và thời lượng',
  })
  @ApiParam({ name: 'id', description: 'ID sân' })
  @ApiQuery({ name: 'date', example: '2026-10-01' })
  @ApiQuery({ name: 'durationMinutes', enum: [60, 90, 120, 180, 240] })
  @ApiOkResponse({
    description: 'Ngày, thời lượng và các khung giờ có thể đặt',
  })
  getAvailability(
    @Param('id') id: string,
    @Query() query: CourtAvailabilityDto,
  ) {
    return this.bookingsService.getCourtAvailability(id, query);
  }
}
