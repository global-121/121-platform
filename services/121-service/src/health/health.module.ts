import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from '@121-service/src/health/health.controller';
import { RedisQueuesHealthIndicator } from '@121-service/src/health/redis-queues.health-indicator';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';

@Module({
  controllers: [HealthController],
  imports: [TerminusModule, QueuesRegistryModule],
  providers: [RedisQueuesHealthIndicator],
})
export class HealthModule {}
