import { DataSource, DeepPartial, Repository } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';

/**
 * Base class for type-safe data factories that generate mock entities.
 * Provides common functionality for batch operations and entity creation.
 */
export abstract class BaseDataFactory<T extends Base121Entity> {
  protected constructor(
    protected readonly dataSource: DataSource,
    protected readonly repository: Repository<T>,
  ) {}

  /**
   * Create a single entity with the provided data
   */
  protected async createEntity(entityData: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(entityData);
    return await this.repository.save(entity);
  }

  /**
   * Create multiple entities in batches for better performance
   */
  protected async createEntitiesBatch(
    entitiesData: DeepPartial<T>[],
    batchSize = 100,
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < entitiesData.length; i += batchSize) {
      const batch = entitiesData.slice(i, i + batchSize);
      const entities = this.repository.create(batch);
      const savedEntities = await this.repository.save(entities);
      results.push(...savedEntities);

      // Log progress for large batches
      if (entitiesData.length > batchSize) {
        console.log(
          `Created ${Math.min(i + batchSize, entitiesData.length)} of ${entitiesData.length} entities`,
        );
      }
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
