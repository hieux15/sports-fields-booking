import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { PrismaService } from '../prisma/prisma.service';
import { validateCourtPrice, validateCourtSchedule } from './court-validation';

@Injectable()
export class CourtsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateCourtDto, userId: string) {
    validateCourtSchedule(dto.openTime, dto.closeTime);
    validateCourtPrice(dto.pricePerHour);
    return this.prisma.court.create({
      data: {
        name: dto.name,
        type: dto.type,
        address: dto.address,
        pricePerHour: dto.pricePerHour,
        openTime: dto.openTime,
        closeTime: dto.closeTime,
        ownerId: userId,
      },
    });
  }

  async findAll() {
    return this.prisma.court.findMany();
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

    return this.prisma.court.update({
      where: { id: courtId },
      data: dto,
    });
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

    return {
      success: true,
      message: `Xóa thành công sân thể thao "${court.name}"`,
    };
  }
}
