import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  // 10 lần/phút cho mỗi IP: đủ thoải mái khi thử tay nhưng chặn spam tài khoản.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Đăng ký tài khoản CUSTOMER',
    description: 'Trả về thông tin tài khoản vừa tạo (không kèm token).',
  })
  @ApiCreatedResponse({ description: 'Tài khoản đã được tạo' })
  @ApiResponse({ status: 409, description: 'Email đã được sử dụng' })
  @ApiResponse({
    status: 429,
    description: 'Quá nhiều lần đăng ký, thử lại sau',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  // Chặn brute-force mật khẩu: 10 lần/phút cho mỗi IP.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Đăng nhập',
    description:
      'Trả về `access_token`. Gọi tiếp `GET /users/me` để lấy thông tin tài khoản.',
  })
  @ApiCreatedResponse({
    description: 'Đăng nhập thành công',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không đúng' })
  @ApiResponse({
    status: 429,
    description: 'Quá nhiều lần đăng nhập, thử lại sau',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
