import { BullRedisClientService } from '@121-service/src/queues-registry/bull-redis-client.service';

describe('BullRedisClientService', () => {
  const redisOptions = {
    host: 'localhost',
    lazyConnect: true,
  };

  it('shares command and subscriber clients but not blocking clients', () => {
    const service = new BullRedisClientService();

    const commandClient = service.createClient({
      type: 'client',
      redisOptions,
    });
    const secondCommandClient = service.createClient({
      type: 'client',
      redisOptions,
    });
    const subscriberClient = service.createClient({
      type: 'subscriber',
      redisOptions,
    });
    const secondSubscriberClient = service.createClient({
      type: 'subscriber',
      redisOptions,
    });
    const blockingClient = service.createClient({
      type: 'bclient',
      redisOptions,
    });
    const secondBlockingClient = service.createClient({
      type: 'bclient',
      redisOptions,
    });

    expect(commandClient).toBe(secondCommandClient);
    expect(subscriberClient).toBe(secondSubscriberClient);
    expect(commandClient).not.toBe(subscriberClient);
    expect(blockingClient).not.toBe(secondBlockingClient);
    expect(subscriberClient.options.maxRetriesPerRequest).toBeNull();
    expect(blockingClient.options.maxRetriesPerRequest).toBeNull();

    for (const client of [
      commandClient,
      subscriberClient,
      blockingClient,
      secondBlockingClient,
    ]) {
      client.disconnect();
    }
  });
});
