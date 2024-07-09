import { HealthController } from '@121-service/src/health/health.controller';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  controllers: [HealthController],
  imports: [TerminusModule],
})
export class HealthModule {}
