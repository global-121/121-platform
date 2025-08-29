import Redis from 'ioredis';

import { env } from '@121-service/src/env';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const getRedisSetName = (projectId: number): string => {
  return `project:${projectId}:jobs`;
};

export const createRedisClient = (): Redis => {
  return new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    tls: !!env.REDIS_PASSWORD ? {} : undefined,
    keyPrefix: `${env.REDIS_PREFIX}:`,
  });
};
