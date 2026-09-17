import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

type RequestWithUser = Parameters<BookingsController['cancel']>[0];

const buildRequest = (id: string, role: Role = Role.CUSTOMER) =>
  ({
    user: { id, email: 'user@example.com', role },
  }) as unknown as RequestWithUser;

describe('BookingsController', () => {
  let controller: BookingsController;
  const bookingsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    cancel: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: bookingsService }],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('ủy quyền tạo booking cho service với id người dùng', async () => {
    const dto: CreateBookingDto = {
      courtId: 'court-1',
      startTime: '2026-01-01T10:00:00.000Z',
      endTime: '2026-01-01T11:00:00.000Z',
    };
    bookingsService.create.mockResolvedValue({ id: 'booking-1' });

    await controller.create(buildRequest('user-1'), dto);

    expect(bookingsService.create).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('ủy quyền lấy danh sách booking cho service với id người dùng', async () => {
    bookingsService.findAll.mockResolvedValue([]);

    await controller.findAll(buildRequest('user-1'));

    expect(bookingsService.findAll).toHaveBeenCalledWith('user-1');
  });

  it('ủy quyền lấy chi tiết booking cho service với id booking và id người dùng', async () => {
    bookingsService.findOne.mockResolvedValue({ id: 'booking-1' });

    await controller.findOne(buildRequest('user-1'), 'booking-1');

    expect(bookingsService.findOne).toHaveBeenCalledWith('booking-1', 'user-1');
  });

  it('ủy quyền hủy booking cho service với id booking và id người dùng', async () => {
    bookingsService.cancel.mockResolvedValue({
      id: 'booking-1',
      status: 'CANCELLED',
    });

    await controller.cancel(buildRequest('user-1'), 'booking-1');

    expect(bookingsService.cancel).toHaveBeenCalledWith('booking-1', 'user-1');
  });

  it('cho phép cả CUSTOMER và OWNER gọi route hủy booking', () => {
    // Đọc hàm qua property descriptor để tránh tham chiếu method không bind.
    const cancelHandler = Object.getOwnPropertyDescriptor(
      BookingsController.prototype,
      'cancel',
    )?.value as object;
    const roles = Reflect.getMetadata(ROLES_KEY, cancelHandler) as Role[];

    expect(roles).toEqual([Role.CUSTOMER, Role.OWNER]);
  });

  it('route hủy booking vẫn ủy quyền đúng khi người gọi là OWNER', async () => {
    bookingsService.cancel.mockResolvedValue({
      id: 'booking-1',
      status: 'CANCELLED',
    });

    await controller.cancel(buildRequest('owner-1', Role.OWNER), 'booking-1');

    expect(bookingsService.cancel).toHaveBeenCalledWith('booking-1', 'owner-1');
  });
});
