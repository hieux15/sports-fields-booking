import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
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

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.findMe(req.user.id);
  }

  @Patch('me')
  updateMe(@Req() req: AuthenticatedRequest, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(req.user.id, dto);
  }

  @Post('become-owner')
  becomeOwner(@Req() req: AuthenticatedRequest, @Body() dto: BecomeOwnerDto) {
    return this.usersService.becomeOwner(req.user.id, dto);
  }
}
