import {
  DataSource,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { ScopedQueryBuilder } from '../../scoped.repository';
import { RequestWithScope } from '../../shared/middleware/scope.middleware';
import { convertToScopedOptions } from '../../utils/scope/createFindWhereOptions.helper';

export class RegistrationScopedBaseRepository<T> {
  public readonly repository: Repository<T>;
  public request: RequestWithScope;

  constructor(target: EntityTarget<T>, dataSource: DataSource) {
    this.repository = dataSource.createEntityManager().getRepository(target);
  }

  public async find(options: FindManyOptions<T>): Promise<T[]> {
    if (!this.request?.scope || this.request.scope === '') {
      return this.repository.find(options);
    }
    const scopedOptions = convertToScopedOptions<T>(
      options,
      [],
      this.request.scope,
    );
    return this.repository.find(scopedOptions);
  }

  public async findOne(options: FindOneOptions<T>): Promise<T> {
    if (!this.request?.scope || this.request.scope === '') {
      return this.repository.findOne(options);
    }
    const scopedOptions = convertToScopedOptions<T>(
      options,
      [],
      this.request.scope,
    );
    return this.repository.findOne(scopedOptions);
  }

  public async count(options?: FindManyOptions<T>): Promise<number> {
    if (!this.request?.scope || this.request.scope === '') {
      return this.repository.count(options);
    }
    const scopedOptions = convertToScopedOptions<T>(
      options,
      [],
      this.request.scope,
    );
    return this.repository.count(scopedOptions);
  }

  public createQueryBuilder(alias: string): ScopedQueryBuilder<T> {
    if (!this.request?.scope || this.request.scope === '') {
      return new ScopedQueryBuilder(this.repository.createQueryBuilder(alias));
    }
    const qb = this.repository
      .createQueryBuilder(alias)
      .leftJoin(`${alias}.program`, 'program')
      .andWhere(
        `(program."enableScope" = false OR ${alias}.scope LIKE :scope)`,
        {
          scope: `${this.request.scope}%`,
        },
      );
    return new ScopedQueryBuilder(qb);
  }
}
