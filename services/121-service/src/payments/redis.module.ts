import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { createRedisClient } from './redis-client';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (): Promise<Redis> => createRedisClient(),
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
