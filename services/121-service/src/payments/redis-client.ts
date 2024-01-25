import Redis from 'ioredis';

export const createRedisClient = () => {
  return new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_PASSWORD ? {} : null,
  });
};
