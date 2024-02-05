import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { createRedisClient, REDIS_CLIENT } from './redis-client';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async (): Promise<Redis> => createRedisClient(),
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
