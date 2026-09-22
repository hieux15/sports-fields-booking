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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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

@ApiTags('Bookings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Tạo đơn đặt sân (CUSTOMER)',
    description:
      'Chống trùng giờ 2 lớp: service trả `409` trước, và ràng buộc `booking_no_overlap` của PostgreSQL chặn cả những writer khác.',
  })
  @ApiCreatedResponse({ description: 'Đơn mới ở trạng thái PENDING' })
  @ApiResponse({
    status: 400,
    description: 'Thời lượng không trong khoảng 1-4 giờ, hoặc ngoài giờ mở cửa',
  })
  @ApiResponse({ status: 404, description: 'Sân thể thao không tồn tại' })
  @ApiResponse({
    status: 409,
    description: 'Sân đã có đơn đặt trong khoảng thời gian này',
  })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto, req.user.id);
  }

  @Get('me')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Đơn đặt sân của chính mình, kèm thông tin sân' })
  @ApiOkResponse({ description: 'Mảng đơn đặt sân' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.bookingsService.findAll(req.user.id);
  }

  @Get(':id')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Chi tiết một đơn của chính mình' })
  @ApiParam({ name: 'id', description: 'ID đơn đặt sân' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn đặt sân này' })
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bookingsService.findOne(id, req.user.id);
  }

  @Patch(':id/cancel')
  @Roles(Role.CUSTOMER, Role.OWNER)
  @ApiOperation({ summary: 'Hủy đơn (khách đặt sân hoặc chủ sân)' })
  @ApiParam({ name: 'id', description: 'ID đơn đặt sân' })
  @ApiResponse({
    status: 400,
    description: 'Đơn đã hủy trước đó hoặc đã tới/qua giờ bắt đầu',
  })
  cancel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bookingsService.cancel(id, req.user.id);
  }

  @Patch(':id/confirm')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Xác nhận đơn đặt trên sân của mình (OWNER)' })
  @ApiParam({ name: 'id', description: 'ID đơn đặt sân' })
  @ApiResponse({ status: 400, description: 'Đơn không ở trạng thái PENDING' })
  confirm(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bookingsService.confirm(id, req.user.id);
  }
}
