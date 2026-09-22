import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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

@ApiTags('Courts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courts')
export class CourtBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get(':id/bookings')
  @Roles(Role.OWNER)
  @ApiOperation({
    summary: 'Đơn đặt sân của một sân thuộc chủ sân đang đăng nhập',
    description:
      'Trả kèm thông tin khách đặt (tên, email, số điện thoại) và sắp xếp theo giờ bắt đầu giảm dần.',
  })
  @ApiParam({ name: 'id', description: 'ID sân' })
  @ApiOkResponse({ description: 'Mảng đơn đặt sân của sân này' })
  @ApiResponse({
    status: 404,
    description: 'Sân không tồn tại hoặc không thuộc chủ sân đang đăng nhập',
  })
  findByCourt(@Req() req: AuthenticatedRequest, @Param('id') courtId: string) {
    return this.bookingsService.findByCourt(courtId, req.user.id);
  }
}
