import chunk from 'lodash/chunk';
import { DataSource, DeepPartial, Repository } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';

export abstract class BaseDataFactory<T extends Base121Entity> {
  protected constructor(
    protected readonly dataSource: DataSource,
    protected readonly repository: Repository<T>,
  ) {}

  /**
   * Insert multiple entities in batches for best performance (returns ids)
   */
  protected async insertEntitiesBatch(
    entitiesData: DeepPartial<T>[],
    batchSize = 2500,
  ): Promise<number[]> {
    const insertedIds: number[] = [];
    let processedSoFar = 0;
    for (const batch of chunk(entitiesData, batchSize)) {
      const result = await this.repository.insert(batch as any[]);
      if (result && Array.isArray(result.identifiers)) {
        insertedIds.push(...result.identifiers.map((idObj) => idObj.id));
      }
      processedSoFar += batch.length;
      this.logBatchProgress(processedSoFar, entitiesData.length, 'Inserted');
    }
    return insertedIds;
  }

  private logBatchProgress(
    processedSoFar: number,
    total: number,
    label: string,
  ) {
    if (total > 0) {
      const done = Math.min(processedSoFar, total);
      console.log(`${label} ${done} of ${total} entities`);
    }
  }
}
