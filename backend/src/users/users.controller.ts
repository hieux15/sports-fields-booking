import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateMeDto } from './dto/update-me.dto';
import { BecomeOwnerDto } from './dto/become-owner.dto';
import { Role } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Thông tin tài khoản đang đăng nhập' })
  @ApiOkResponse({ description: 'Không bao giờ trả về trường password' })
  @ApiResponse({ status: 401, description: 'Thiếu hoặc sai access token' })
  getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.findMe(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật name / phone của chính mình' })
  @ApiOkResponse({ description: 'Trả về hồ sơ sau khi cập nhật' })
  @ApiResponse({ status: 401, description: 'Thiếu hoặc sai access token' })
  updateMe(@Req() req: AuthenticatedRequest, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(req.user.id, dto);
  }

  @Post('become-owner')
  @ApiOperation({
    summary: 'Nâng cấp tài khoản thành OWNER và tạo sân đầu tiên',
    description:
      'Đổi role và tạo sân trong cùng một transaction, nên không thể sinh ra tài khoản OWNER mà không có sân.',
  })
  @ApiCreatedResponse({
    description: 'Trả về `{ user, court }` sau khi nâng cấp thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Giờ mở/đóng cửa hoặc giá không hợp lệ',
  })
  @ApiResponse({ status: 409, description: 'Tài khoản đã là chủ sân' })
  becomeOwner(@Req() req: AuthenticatedRequest, @Body() dto: BecomeOwnerDto) {
    return this.usersService.becomeOwner(req.user.id, dto);
  }
}
