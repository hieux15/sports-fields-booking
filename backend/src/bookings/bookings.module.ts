import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsScheduler } from './bookings.scheduler';
import { BookingsController } from './bookings.controller';
import { CourtBookingsController } from './court-bookings.controller';
import { CourtAvailabilityController } from './court-availability.controller';

@Module({
  controllers: [
    BookingsController,
    CourtBookingsController,
    CourtAvailabilityController,
  ],
  providers: [BookingsService, BookingsScheduler],
})
export class BookingsModule {}
