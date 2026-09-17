import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('ủy quyền đăng ký cho service', async () => {
    const dto: RegisterDto = {
      email: 'customer@test.com',
      password: '123456',
      name: 'Nguyễn Văn A',
    };
    authService.register.mockResolvedValue({ id: 'user-1' });

    await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('ủy quyền đăng nhập cho service', async () => {
    const dto: LoginDto = {
      email: 'customer@test.com',
      password: '123456',
    };
    authService.login.mockResolvedValue({ access_token: 'jwt' });

    await controller.login(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
  });
});
