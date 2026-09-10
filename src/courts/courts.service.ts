import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CourtsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateCourtDto, userId: string) {
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

    return {
      success: true,
      message: `Xóa thành công sân thể thao "${court.name}"`,
    };
  }
}
