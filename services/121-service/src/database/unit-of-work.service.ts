import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { AsyncLocalStorage } from 'async_hooks';
import { DataSource, EntityManager } from 'typeorm';

interface Store {
  manager: EntityManager;
}

/**
 * It creates a new entity manager to run the database operations
 * inside a transaction by injecting the created manager entity manager
 */
@Injectable()
export class UnitOfWork {
  protected readonly storage = new AsyncLocalStorage<Store>();

  constructor(
    @InjectDataSource()
    protected dataSource: DataSource,
  ) {}

  /**
   * Return either the default connection manager or the transaction
   * manager if the execute function has been called prior to this call.
   * @returns EntityManager
   */
  getManager(): EntityManager {
    const store = this.storage.getStore();
    if (!store?.manager) {
      return this.dataSource.manager;
    }
    return store.manager;
  }

  /**
   * Start a transactional operation.
   * A transaction is created from the connection and the created manager
   * is assigned as the unit of work's manager. All operations executed within
   * this function will use the transaction manager.
   *
   * If at least one of the operations from the transaction fails, this function
   * will throw and all the previous operation will be rolled back.
   * @param next
   * @returns
   */
  execute<V>(next: () => Promise<V>): Promise<V> {
    return this.dataSource.transaction((manager: EntityManager) => {
      return this.storage.run({ manager }, () => {
        return next();
      });
    });
  }
}
