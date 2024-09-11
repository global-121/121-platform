import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

import { APP_VERSION } from '@121-service/src/config';

@ApiTags('instance')
// TODO: REFACTOR: rename to instance
@Controller('health')
export class HealthController {
  public constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @ApiOperation({ summary: 'Get health of instance' })
  @Get('health')
  @HealthCheck()
  public check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 300 }),
    ]);
  }

  @ApiOperation({ summary: 'Get version of instance' })
  @Get('version')
  public version(): {
    schemaVersion: number;
    label: string;
    message: string;
    isError?: boolean;
  } {
    const version = APP_VERSION;

    // See: https://shields.io/endpoint
    return {
      schemaVersion: 1,
      label: 'build',
      message: !!version ? version.trim() : 'n/a',
      isError: !version,
    };
  }
}
