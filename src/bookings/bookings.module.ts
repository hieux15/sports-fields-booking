import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { CourtBookingsController } from './court-bookings.controller';

@Module({
  controllers: [BookingsController, CourtBookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
