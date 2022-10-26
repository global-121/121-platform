import { Controller, Get, Module } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  TerminusModule,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  public constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  @Get('health')
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 300 }),
    ]);
  }
}

@Module({
  controllers: [HealthController],
  imports: [TerminusModule],
})
export class HealthModule {}
