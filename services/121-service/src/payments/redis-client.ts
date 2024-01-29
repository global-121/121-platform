import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const getRedisSetName = (programId: number): string => {
  return `program:${programId}:jobs`;
};

export const createRedisClient = (): Redis => {
  return new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_PASSWORD ? {} : null,
  });
};
