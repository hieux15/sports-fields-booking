import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Dùng để Render/Railway/Fly hoặc Docker healthcheck gọi định kỳ: trả 200 khi
   * API và database đều sống, 503 khi một trong hai chết.
   */
  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Health check cho deploy (API + database)',
    description:
      'Trả `200` khi mọi thành phần đều sống và `503` khi database không truy vấn được.',
  })
  @ApiOkResponse({
    description: 'API và database đều sống',
    schema: {
      type: 'object',
      example: {
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'Database không phản hồi',
  })
  check() {
    return this.health.check([
      // Pooler của Supabase/Neon có thể mất hơn 1s ở lần kết nối đầu tiên, nên
      // nới timeout thay vì để healthcheck báo chết oan khi vừa deploy.
      () =>
        this.prismaIndicator.pingCheck('database', this.prisma, {
          timeout: 5000,
        }),
    ]);
  }
}
