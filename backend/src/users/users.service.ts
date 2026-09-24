import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { BecomeOwnerDto } from './dto/become-owner.dto';
import {
  validateCourtPrice,
  validateCourtSchedule,
} from '../courts/court-validation';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    return user;
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: dto.name,
        phone: dto.phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async becomeOwner(userId: string, dto: BecomeOwnerDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }
    if (user.role === Role.OWNER) {
      throw new ConflictException('Tài khoản đã là chủ sân');
    }

    // Luồng này cũng tạo sân nên phải dùng chung validator với CourtsService,
    // nếu không sẽ tạo được sân có openTime/closeTime hoặc giá không hợp lệ.
    validateCourtSchedule(dto.openTime, dto.closeTime);
    validateCourtPrice(dto.pricePerHour);

    return this.prisma.$transaction(async (tx) => {
      // Vẫn phải kiểm tra role bên trong transaction: hai request đồng thời có thể
      // cùng vượt qua kiểm tra phía trên rồi mỗi request tạo một sân cho cùng tài khoản.
      const upgraded = await tx.user.updateMany({
        where: { id: userId, role: Role.CUSTOMER },
        data: { role: Role.OWNER },
      });

      if (upgraded.count === 0) {
        throw new ConflictException('Tài khoản đã là chủ sân');
      }

      const owner = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });
      const court = await tx.court.create({
        data: {
          name: dto.name,
          type: dto.type,
          address: dto.address,
          imageUrl: dto.imageUrl,
          pricePerHour: dto.pricePerHour,
          openTime: dto.openTime,
          closeTime: dto.closeTime,
          ownerId: userId,
        },
      });

      return { user: owner, court };
    });
  }
}
