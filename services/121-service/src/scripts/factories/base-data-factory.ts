import chunk from 'lodash/chunk';
import { DataSource, DeepPartial, Repository } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';

export abstract class BaseDataFactory<T extends Base121Entity> {
  protected constructor(
    protected readonly dataSource: DataSource,
    protected readonly repository: Repository<T>,
  ) {}

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

  /**
   * Save multiple entities in batches (returns full entities, runs hooks/relations)
   */
  protected async saveEntitiesBatch(
    entitiesData: DeepPartial<T>[],
    batchSize = 2500,
  ): Promise<T[]> {
    const results: T[] = [];
    let processedSoFar = 0;
    for (const batch of chunk(entitiesData, batchSize)) {
      const entities = this.repository.create(batch);
      const savedEntities = await this.repository.save(entities);
      results.push(...savedEntities);
      processedSoFar += batch.length;
      this.logBatchProgress(processedSoFar, entitiesData.length, 'Saved');
    }
    return results;
  }

  /**
   * Get the next sequence value for auto-incrementing fields
   */
  protected async getNextSequenceValue(
    tableName: string,
    sequenceName?: string,
  ): Promise<number> {
    const actualSequenceName = sequenceName || `${tableName}_id_seq`;
    const result = await this.dataSource.query(
      `SELECT nextval('121-service.${actualSequenceName}') as next_id`,
    );
    return parseInt(result[0].next_id, 10);
  }

  /**
   * Generate unique reference ID
   */
  protected generateUniqueReferenceId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generate random phone number
   */
  protected generatePhoneNumber(): string {
    return `+254${Math.floor(Math.random() * 900000000) + 100000000}`;
  }
}
