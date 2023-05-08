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

  @Get('health')
  @HealthCheck()
  public check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 300 }),
    ]);
  }

  @Get('version')
  public version(): {
    schemaVersion: number;
    label: string;
    message: string;
  } {
    return {
      schemaVersion: 1,
      label: 'build',
      message: process.env.GLOBAL_121_VERSION,
    };
  }
}

@Module({
  controllers: [HealthController],
  imports: [TerminusModule],
})
export class HealthModule {}
