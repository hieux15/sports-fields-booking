import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

type IndicatorFn = () => Promise<unknown>;

describe('HealthController', () => {
  let controller: HealthController;
  const health = { check: jest.fn() };
  const prismaIndicator = { pingCheck: jest.fn() };
  const prisma = {};

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: health },
        { provide: PrismaHealthIndicator, useValue: prismaIndicator },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uỷ quyền cho HealthCheckService với một indicator kiểm tra database', async () => {
    const indicators: IndicatorFn[] = [];
    health.check.mockImplementation((list: IndicatorFn[]) => {
      indicators.push(...list);
      return Promise.resolve({ status: 'ok' });
    });

    await controller.check();

    expect(indicators).toHaveLength(1);

    prismaIndicator.pingCheck.mockResolvedValue({ database: { status: 'up' } });

    await expect(indicators[0]()).resolves.toEqual({
      database: { status: 'up' },
    });
    expect(prismaIndicator.pingCheck).toHaveBeenCalledWith('database', prisma, {
      timeout: 5000,
    });
  });
});
