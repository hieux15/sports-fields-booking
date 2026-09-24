import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CourtsService } from './courts.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { UpdateCourtDto } from './dto/update-court.dto';
import { QueryCourtsDto } from './dto/query-courts.dto';
import { PAGINATED_SCHEMA } from '../common/paginated';
import { StorageService } from '../storage/storage.service';
import {
  IMAGE_MIME_EXTENSIONS,
  MAX_IMAGE_BYTES_LIMIT,
  isAllowedImageMime,
} from '../storage/image-upload';
// `import type` là bắt buộc: type này dùng trong chữ ký có decorator, mà
// isolatedModules + emitDecoratorMetadata không cho phép trộn vào import giá trị.
import type { UploadedImageFile } from '../storage/image-upload';
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@ApiTags('Courts')
@Controller('courts')
export class CourtsController {
  constructor(
    private readonly courtsService: CourtsService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Tạo sân mới (OWNER)' })
  @ApiCreatedResponse({ description: 'Sân đã được tạo' })
  @ApiResponse({
    status: 400,
    description: 'Giờ mở/đóng cửa hoặc giá thuê không hợp lệ',
  })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateCourtDto) {
    return this.courtsService.create(dto, req.user.id);
  }

  @Post('images')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Tải ảnh sân lên (tài khoản đã đăng nhập)',
    description:
      'Gửi `multipart/form-data` với field `file`. Nhận jpg, png, webp, avif, gif, dung lượng ' +
      'theo `UPLOAD_MAX_BYTES` (mặc định 5MB). Ảnh được lưu trên Supabase Storage nếu đã cấu ' +
      'hình, ngược lại ghi vào backend/uploads. Dùng `imageUrl` trả về cho `POST /courts` ' +
      'hoặc `PATCH /courts/{id}`. CUSTOMER cũng được tải trước ở luồng đăng ký sân đầu tiên; ' +
      'các API tạo/sửa/xoá sân vẫn chỉ dành cho OWNER.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File ảnh của sân',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'URL công khai của ảnh vừa lưu',
    schema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string', example: '/uploads/courts/a1b2.webp' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Thiếu file, sai định dạng ảnh hoặc ảnh vượt quá dung lượng',
  })
  @ApiResponse({ status: 502, description: 'Storage từ chối lưu ảnh' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_BYTES_LIMIT, files: 1 },
      fileFilter: (_req, file, callback) => {
        if (isAllowedImageMime(file.mimetype)) {
          callback(null, true);
          return;
        }
        callback(
          new BadRequestException(
            `Chỉ nhận ảnh ${Object.keys(IMAGE_MIME_EXTENSIONS).join(', ')}`,
          ),
          false,
        );
      },
    }),
  )
  uploadImage(@UploadedFile() file?: UploadedImageFile) {
    return this.storageService.saveCourtImage(file);
  }

  @Get()
  @ApiOperation({
    summary: 'Tìm kiếm / lọc / sắp xếp / phân trang danh sách sân',
    description:
      'Mọi tham số đều tuỳ chọn. `q` tìm trong tên và địa chỉ, `type` lọc theo loại sân (không phân biệt hoa thường), `minPrice`/`maxPrice` lọc theo giá, `sort` chọn thứ tự. ' +
      '`pricePerHour` là Prisma Decimal nên trả về dạng chuỗi.',
  })
  @ApiOkResponse({
    description: 'Danh sách sân của trang hiện tại',
    schema: PAGINATED_SCHEMA,
  })
  @ApiResponse({ status: 400, description: 'Tham số query không hợp lệ' })
  findAll(@Query() query: QueryCourtsDto) {
    return this.courtsService.findAll(query);
  }

  // Phải khai báo trước @Get(':id') để "me" không bị hiểu là id sân
  @Get('me')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Sân của chính chủ sân đang đăng nhập' })
  @ApiOkResponse({ description: 'Mảng sân sắp xếp theo tên' })
  findMine(@Req() req: AuthenticatedRequest) {
    return this.courtsService.findMyCourts(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết sân kèm tên và số điện thoại chủ sân' })
  @ApiParam({ name: 'id', description: 'ID sân' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sân thể thao này' })
  findOne(@Param('id') id: string) {
    return this.courtsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Cập nhật sân của chính mình (OWNER)' })
  @ApiParam({ name: 'id', description: 'ID sân' })
  @ApiResponse({
    status: 404,
    description: 'Sân không tồn tại hoặc không phải của bạn',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCourtDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.courtsService.updateMyCourt(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiOperation({
    summary: 'Xóa sân của chính mình (OWNER)',
    description:
      'Trả 400 khi sân vẫn còn đơn chưa hủy. Khi xóa thành công, các đơn đã hủy của sân cũng bị xóa trong cùng transaction.',
  })
  @ApiParam({ name: 'id', description: 'ID sân' })
  @ApiResponse({ status: 400, description: 'Sân vẫn còn đơn đặt chưa hủy' })
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.courtsService.removeMyCourt(id, req.user.id);
  }
}
