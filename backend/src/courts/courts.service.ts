import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Court, Prisma } from '@prisma/client';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import {
  CourtSort,
  DEFAULT_PAGE_SIZE,
  QueryCourtsDto,
} from './dto/query-courts.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Paginated, toPaginated } from '../common/paginated';
import { validateCourtPrice, validateCourtSchedule } from './court-validation';
import { StorageService } from '../storage/storage.service';

const COURT_ORDER_BY: Record<
  CourtSort,
  Prisma.CourtOrderByWithRelationInput[]
> = {
  name_asc: [{ name: 'asc' }, { id: 'asc' }],
  name_desc: [{ name: 'desc' }, { id: 'asc' }],
  price_asc: [{ pricePerHour: 'asc' }, { name: 'asc' }, { id: 'asc' }],
  price_desc: [{ pricePerHour: 'desc' }, { name: 'asc' }, { id: 'asc' }],
};

/** Dựng điều kiện WHERE từ query string, tất cả đều lọc ở database. */
function buildCourtWhere(query: QueryCourtsDto): Prisma.CourtWhereInput {
  const where: Prisma.CourtWhereInput = {};

  const keyword = query.q?.trim();
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { address: { contains: keyword, mode: 'insensitive' } },
    ];
  }

  const type = query.type?.trim();
  if (type) {
    where.type = { equals: type, mode: 'insensitive' };
  }

  const pricePerHour: { gte?: number; lte?: number } = {};
  if (query.minPrice !== undefined) {
    pricePerHour.gte = query.minPrice;
  }
  if (query.maxPrice !== undefined) {
    pricePerHour.lte = query.maxPrice;
  }
  if (Object.keys(pricePerHour).length > 0) {
    where.pricePerHour = pricePerHour;
  }

  return where;
}

@Injectable()
export class CourtsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  create(dto: CreateCourtDto, userId: string) {
    validateCourtSchedule(dto.openTime, dto.closeTime);
    validateCourtPrice(dto.pricePerHour);
    return this.prisma.court.create({
      data: {
        name: dto.name,
        type: dto.type,
        address: dto.address,
        // Ảnh do chủ sân upload trước qua POST /courts/images (có thể bỏ trống).
        imageUrl: dto.imageUrl,
        pricePerHour: dto.pricePerHour,
        openTime: dto.openTime,
        closeTime: dto.closeTime,
        ownerId: userId,
      },
    });
  }

  /**
   * Tìm kiếm + lọc + sắp xếp + phân trang đều thực hiện trong database, nên
   * client không phải tải cả bảng về rồi tự lọc.
   */
  async findAll(query: QueryCourtsDto): Promise<Paginated<Court>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    const sort = query.sort ?? 'name_asc';
    const where = buildCourtWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.court.findMany({
        where,
        orderBy: COURT_ORDER_BY[sort],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.court.count({ where }),
    ]);

    return toPaginated(items, total, page, limit);
  }

  // Lấy danh sách sân của chính chủ sân đang đăng nhập
  async findMyCourts(userId: string) {
    return this.prisma.court.findMany({
      where: { ownerId: userId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(courtId: string) {
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
      include: {
        owner: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!court) {
      throw new NotFoundException('Không tìm thấy sân thể thao này');
    }

    return court;
  }

  async updateMyCourt(courtId: string, userId: string, dto: UpdateCourtDto) {
    const court = await this.prisma.court.findUnique({
      where: {
        id: courtId,
        ownerId: userId,
      },
    });

    if (!court) {
      throw new NotFoundException(
        'Sân thể thao không tồn tại hoặc bạn không có quyền chỉnh sửa sân này',
      );
    }

    validateCourtSchedule(
      dto.openTime ?? court.openTime,
      dto.closeTime ?? court.closeTime,
    );
    validateCourtPrice(dto.pricePerHour ?? Number(court.pricePerHour));

    const updated = await this.prisma.court.update({
      where: { id: courtId },
      data: dto,
    });

    // Đổi ảnh thì dọn ảnh cũ để không để lại file mồ côi trên storage.
    if (
      dto.imageUrl !== undefined &&
      court.imageUrl &&
      court.imageUrl !== dto.imageUrl
    ) {
      await this.storage.removeCourtImage(court.imageUrl);
    }

    return updated;
  }

  async removeMyCourt(courtId: string, userId: string) {
    const court = await this.prisma.court.findUnique({
      where: {
        id: courtId,
        ownerId: userId,
      },
    });

    if (!court) {
      throw new NotFoundException(
        'Sân thể thao không tồn tại hoặc bạn không có quyền xóa sân này',
      );
    }

    // Chỉ cho xóa khi sân không còn đơn đặt sân đang chờ/đã xác nhận
    const activeBookings = await this.prisma.booking.count({
      where: {
        courtId: courtId,
        status: {
          not: 'CANCELLED',
        },
      },
    });

    if (activeBookings > 0) {
      throw new BadRequestException(
        `Không thể xóa sân "${court.name}" vì vẫn còn ${activeBookings} đơn đặt sân chưa hủy`,
      );
    }

    // Xóa kèm các đơn đã hủy để không vi phạm khóa ngoại Booking.courtId
    await this.prisma.$transaction(async (tx) => {
      await tx.booking.deleteMany({
        where: {
          courtId: courtId,
          status: 'CANCELLED',
        },
      });
      await tx.court.delete({ where: { id: courtId } });
    });

    // Ảnh chỉ được dọn sau khi DB đã xoá xong, và không chặn kết quả trả về.
    await this.storage.removeCourtImage(court.imageUrl);

    return {
      success: true,
      message: `Xóa thành công sân thể thao "${court.name}"`,
    };
  }
}
