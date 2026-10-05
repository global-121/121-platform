import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { JobCounts, Queue } from 'bull';
import { setTimeout } from 'node:timers/promises';

import { env } from '@121-service/src/env';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';

interface QueueMetrics extends JobCounts {
  isPaused: boolean;
}

interface RedisQueuesMetrics {
  pingLatencyMs: number;
  redis: {
    connectedClients?: number;
    blockedClients?: number;
    usedMemory?: string;
    maxMemory?: string;
    memoryFragmentationRatio?: number;
    opsPerSecond?: number;
    evictedKeys?: number;
  };
  queues: Record<string, QueueMetrics>;
  totals: QueueMetrics & { pausedQueues: string[] };
}

@Injectable()
export class RedisQueuesHealthIndicator {
  public constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly queuesRegistryService: QueuesRegistryService,
  ) {}

  public async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      const metrics = await this.collectMetricsWithTimeout();
      return indicator.up({ ...metrics });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return indicator.down({ message });
    }
  }

  private async collectMetricsWithTimeout(): Promise<RedisQueuesMetrics> {
    return await Promise.race([
      this.collectMetrics(),
      (async (): Promise<never> => {
        await setTimeout(env.HEALTH_REDIS_TIMEOUT);
        throw new Error(
          `Redis health check timed out after ${env.HEALTH_REDIS_TIMEOUT}ms`,
        );
      })(),
    ]);
  }

  private async collectMetrics(): Promise<RedisQueuesMetrics> {
    const queues = this.queuesRegistryService.getAllQueues();
    if (queues.length === 0) {
      throw new Error('No queues registered');
    }

    // All queues share the same command client (see BullRedisClientsService),
    // so any queue's client represents the Redis connection.
    const client = queues[0].client;

    const pingStart = Date.now();
    await client.ping();
    const pingLatencyMs = Date.now() - pingStart;

    const [clientsInfo, memoryInfo, statsInfo] = await Promise.all([
      client.info('clients'),
      client.info('memory'),
      client.info('stats'),
    ]);
    const clients = parseRedisInfoSection({ section: clientsInfo });
    const memory = parseRedisInfoSection({ section: memoryInfo });
    const stats = parseRedisInfoSection({ section: statsInfo });

    const queueMetrics = await this.getQueueMetrics({ queues });

    return {
      pingLatencyMs,
      redis: {
        connectedClients: getInfoNumber({
          info: clients,
          key: 'connected_clients',
        }),
        blockedClients: getInfoNumber({
          info: clients,
          key: 'blocked_clients',
        }),
        usedMemory: memory.get('used_memory_human'),
        maxMemory: memory.get('maxmemory_human'),
        memoryFragmentationRatio: getInfoNumber({
          info: memory,
          key: 'mem_fragmentation_ratio',
        }),
        opsPerSecond: getInfoNumber({
          info: stats,
          key: 'instantaneous_ops_per_sec',
        }),
        evictedKeys: getInfoNumber({ info: stats, key: 'evicted_keys' }),
      },
      queues: Object.fromEntries(queueMetrics),
      totals: this.getTotals({ queueMetrics }),
    };
  }

  private async getQueueMetrics({
    queues,
  }: {
    queues: Queue[];
  }): Promise<Map<string, QueueMetrics>> {
    const queueMetrics = new Map<string, QueueMetrics>();
    for (const queue of queues) {
      const [counts, isPaused] = await Promise.all([
        queue.getJobCounts(),
        queue.isPaused(),
      ]);
      queueMetrics.set(queue.name, { ...counts, isPaused });
    }
    return queueMetrics;
  }

  private getTotals({
    queueMetrics,
  }: {
    queueMetrics: Map<string, QueueMetrics>;
  }): RedisQueuesMetrics['totals'] {
    const totals: RedisQueuesMetrics['totals'] = {
      active: 0,
      completed: 0,
      delayed: 0,
      failed: 0,
      waiting: 0,
      isPaused: false,
      pausedQueues: [],
    };

    for (const [queueName, metrics] of queueMetrics) {
      totals.active += metrics.active;
      totals.completed += metrics.completed;
      totals.delayed += metrics.delayed;
      totals.failed += metrics.failed;
      totals.waiting += metrics.waiting;
      if (metrics.isPaused) {
        totals.pausedQueues.push(queueName);
      }
    }
    totals.isPaused = totals.pausedQueues.length > 0;

    return totals;
  }
}

function parseRedisInfoSection({
  section,
}: {
  section: string;
}): Map<string, string> {
  const entries = new Map<string, string>();
  for (const line of section.split('\n')) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    entries.set(
      trimmedLine.slice(0, separatorIndex),
      trimmedLine.slice(separatorIndex + 1),
    );
  }
  return entries;
}

function getInfoNumber({
  info,
  key,
}: {
  info: Map<string, string>;
  key: string;
}): number | undefined {
  const value = info.get(key);
  if (value === undefined) {
    return undefined;
  }
  return Number(value);
}
