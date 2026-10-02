import { Injectable } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';

import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';

// Bull adds a permanent and a temporary (while connecting) 'error' listener per queue
const MAX_LISTENERS_PER_QUEUE = 2;
const MAX_LISTENERS_PER_SHARED_CLIENT =
  Object.values(QueueNames).length * MAX_LISTENERS_PER_QUEUE;

type BullClientType = 'bclient' | 'client' | 'subscriber';
type SharedBullClientType = Exclude<BullClientType, 'bclient'>;

@Injectable()
export class BullRedisClientsService {
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
    client.setMaxListeners(MAX_LISTENERS_PER_SHARED_CLIENT);
    this.sharedClients.set(type, client);

    return client;
  }
}
