import { Module } from '@nestjs/common';
import Redis from 'ioredis';

import {
  createRedisClient,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis-client';

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
