import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

type RequestWithUser = Parameters<UsersController['getMe']>[0];

const buildRequest = (id: string) =>
  ({
    user: { id, email: 'customer@example.com', role: 'CUSTOMER' },
  }) as unknown as RequestWithUser;

describe('UsersController', () => {
  let controller: UsersController;
  const usersService = {
    findMe: jest.fn(),
    updateMe: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('ủy quyền lấy hồ sơ cho service với id người dùng', async () => {
    await controller.getMe(buildRequest('user-1'));

    expect(usersService.findMe).toHaveBeenCalledWith('user-1');
  });

  it('ủy quyền cập nhật hồ sơ cho service với id người dùng', async () => {
    const dto = { name: 'Nguyễn Văn A', phone: '0900000000' };

    await controller.updateMe(buildRequest('user-1'), dto);

    expect(usersService.updateMe).toHaveBeenCalledWith('user-1', dto);
  });
});
