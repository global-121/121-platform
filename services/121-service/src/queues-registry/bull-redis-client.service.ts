import { Injectable } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';

type BullClientType = 'bclient' | 'client' | 'subscriber';
type SharedBullClientType = Exclude<BullClientType, 'bclient'>;

@Injectable()
export class BullRedisClientService {
  private readonly sharedClients = new Map<SharedBullClientType, Redis>();

  public createClient({
    type,
    redisOptions,
  }: {
    type: BullClientType;
    redisOptions?: RedisOptions;
  }): Redis {
    if (type === 'bclient') {
      return this.createBlockingClient({ redisOptions });
    }

    return this.getSharedClient({ type, redisOptions });
  }

  private createBlockingClient({
    redisOptions,
  }: {
    redisOptions?: RedisOptions;
  }): Redis {
    return new Redis({
      ...redisOptions,
      maxRetriesPerRequest: null,
    });
  }

  private getSharedClient({
    type,
    redisOptions,
  }: {
    type: SharedBullClientType;
    redisOptions?: RedisOptions;
  }): Redis {
    const existingClient = this.sharedClients.get(type);
    if (existingClient) {
      return existingClient;
    }

    const client = new Redis({
      ...redisOptions,
      ...(type === 'subscriber' ? { maxRetriesPerRequest: null } : {}),
    });
    this.sharedClients.set(type, client);

    return client;
  }
}
