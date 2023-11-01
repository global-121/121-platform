import { Request } from 'express';
import { DataSource, FindManyOptions, Like, Repository } from 'typeorm';
import { EntityTarget } from 'typeorm/common/EntityTarget';

// TODO use this for any entity that needs to be scoped
export class ScopedRepository<T> {
  private repository: Repository<T>;
  public request: Request;

  constructor(target: EntityTarget<T>, dataSource: DataSource) {
    this.repository = dataSource.createEntityManager().getRepository(target);
  }

  public async find(options: FindManyOptions<T>): Promise<T[]> {
    console.log('this.request.scope: ', this.request.scope);
    const scopedOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        scope: Like(`${this.request.scope}%`),
      },
    };
    // Replace any for an actual type if possible
    return this.repository.find(scopedOptions as any);
  }

  // Make this strongly typed
  public async save(things: any): Promise<any> {
    return this.repository.save(things);
  }
  // Make this strongly typed
  public createQueryBuilder(things: any): any {
    return this.repository.createQueryBuilder(things);
  }
}
