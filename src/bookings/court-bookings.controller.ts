import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courts')
export class CourtBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get(':id/bookings')
  @Roles(Role.OWNER)
  findByCourt(@Req() req: AuthenticatedRequest, @Param('id') courtId: string) {
    return this.bookingsService.findByCourt(courtId, req.user.id);
  }
}
