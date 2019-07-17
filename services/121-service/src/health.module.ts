import { Module } from '@nestjs/common';
import {
  TerminusModule,
  TerminusModuleOptions,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';

const getTerminusOptions = (
  db: TypeOrmHealthIndicator,
): TerminusModuleOptions => ({
  endpoints: [
    {
      url: '/health',
      // All the indicator which will be checked when requesting /health
      healthIndicators: [
        // Set the timeout for a response to 300ms
        async () => db.pingCheck('database', { timeout: 300 }),
      ],
    },
  ],
});

@Module({
  imports: [
    // Make sure TypeOrmModule is available in the module context
    TypeOrmModule.forRoot(),
    TerminusModule.forRootAsync({
      // Inject the TypeOrmHealthIndicator provided by nestjs/terminus
      inject: [TypeOrmHealthIndicator],
      useFactory: getTerminusOptions,
    }),
  ],
})
export class HealthModule {}
