import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
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
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto, req.user.id);
  }

  @Get('me')
  @Roles(Role.CUSTOMER)
  findAll(@Req() req: AuthenticatedRequest) {
    return this.bookingsService.findAll(req.user.id);
  }

  @Get(':id')
  @Roles(Role.CUSTOMER)
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bookingsService.findOne(id, req.user.id);
  }

  @Patch(':id/cancel')
  @Roles(Role.CUSTOMER, Role.OWNER)
  cancel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bookingsService.cancel(id, req.user.id);
  }

  @Patch(':id/confirm')
  @Roles(Role.OWNER)
  confirm(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bookingsService.confirm(id, req.user.id);
  }
}
