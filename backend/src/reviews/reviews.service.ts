import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(courtId: string, userId: string, dto: CreateReviewDto) {
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
    });
    if (!court) {
      throw new NotFoundException('Sân thể thao không tồn tại');
    }

    const hasCompletedBooking = await this.prisma.booking.findFirst({
      where: {
        courtId,
        userId,
        status: 'COMPLETED',
      },
    });

    if (!hasCompletedBooking) {
      throw new BadRequestException(
        'Bạn cần có đơn đặt sân đã hoàn thành để đánh giá sân này',
      );
    }

    const review = await this.prisma.review.create({
      data: {
        courtId,
        userId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    await this.recalculateAvgRating(courtId);

    return {
      id: review.id,
      userId: review.userId,
      courtId: review.courtId,
      rating: review.rating,
      comment: review.comment,
      userName: review.user.name,
      createdAt: review.createdAt.toISOString(),
    };
  }

  async findByCourt(courtId: string) {
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
    });
    if (!court) {
      throw new NotFoundException('Sân thể thao không tồn tại');
    }

    const reviews = await this.prisma.review.findMany({
      where: { courtId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((review) => ({
      id: review.id,
      userId: review.userId,
      courtId: review.courtId,
      rating: review.rating,
      comment: review.comment,
      userName: review.user.name,
      createdAt: review.createdAt.toISOString(),
    }));
  }

  async findMyReview(courtId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: {
        userId_courtId: {
          userId,
          courtId,
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!review) return null;

    return {
      id: review.id,
      userId: review.userId,
      courtId: review.courtId,
      rating: review.rating,
      comment: review.comment,
      userName: review.user.name,
      createdAt: review.createdAt.toISOString(),
    };
  }

  async update(reviewId: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa đánh giá này');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    await this.recalculateAvgRating(review.courtId);

    return {
      id: updated.id,
      userId: updated.userId,
      courtId: updated.courtId,
      rating: updated.rating,
      comment: updated.comment,
      userName: updated.user.name,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async remove(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
    }

    const courtId = review.courtId;
    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    await this.recalculateAvgRating(courtId);

    return { success: true };
  }

  async recalculateAvgRating(courtId: string) {
    const result = await this.prisma.review.aggregate({
      where: { courtId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const avgRating =
      result._count.rating > 0 ? Number(result._avg.rating!.toFixed(1)) : null;

    await this.prisma.court.update({
      where: { id: courtId },
      data: { avgRating },
    });
  }
}
