import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Req,
  Body,
  UseGuards,
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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
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

@ApiTags('Reviews')
@Controller('courts')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(':id/reviews')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Tạo đánh giá cho sân (CUSTOMER)' })
  @ApiParam({ name: 'id', description: 'ID sân' })
  @ApiCreatedResponse({ description: 'Đánh giá đã được tạo' })
  @ApiResponse({
    status: 400,
    description: 'Sân không tồn tại hoặc bạn chưa có đơn COMPLETED',
  })
  create(
    @Req() req: AuthenticatedRequest,
    @Param('id') courtId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(courtId, req.user.id, dto);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Danh sách đánh giá của sân (public)' })
  @ApiParam({ name: 'id', description: 'ID sân' })
  @ApiOkResponse({ description: 'Mảng đánh giá của sân' })
  @ApiResponse({ status: 404, description: 'Sân không tồn tại' })
  findByCourt(@Param('id') courtId: string) {
    return this.reviewsService.findByCourt(courtId);
  }

  @Patch('reviews/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Cập nhật đánh giá của chính mình (CUSTOMER)' })
  @ApiParam({ name: 'id', description: 'ID đánh giá' })
  @ApiOkResponse({ description: 'Đánh giá đã được cập nhật' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền chỉnh sửa đánh giá này',
  })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') reviewId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(reviewId, req.user.id, dto);
  }

  @Delete('reviews/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Xóa đánh giá của chính mình (CUSTOMER)' })
  @ApiParam({ name: 'id', description: 'ID đánh giá' })
  @ApiOkResponse({ description: 'Đánh giá đã được xóa' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa đánh giá này' })
  remove(@Req() req: AuthenticatedRequest, @Param('id') reviewId: string) {
    return this.reviewsService.remove(reviewId, req.user.id);
  }
}
