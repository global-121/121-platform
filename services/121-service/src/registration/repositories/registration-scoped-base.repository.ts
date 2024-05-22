import {
  DataSource,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { hasNoUserScope, ScopedQueryBuilder } from '../../scoped.repository';
import { ScopedUserRequest } from '../../shared/scoped-user-request';
import { convertToScopedOptions } from '../../utils/scope/createFindWhereOptions.helper';

export class RegistrationScopedBaseRepository<T> {
  public readonly repository: Repository<T>;
  public request: ScopedUserRequest;

  constructor(target: EntityTarget<T>, dataSource: DataSource) {
    this.repository = dataSource.createEntityManager().getRepository(target);
  }

  public async find(options: FindManyOptions<T>): Promise<T[]> {
    if (hasNoUserScope(this.request)) {
      return this.repository.find(options);
    }
    const scopedOptions = convertToScopedOptions<T>(
      options,
      [],
      this.request.user.scope,
    );
    return this.repository.find(scopedOptions);
  }

  public async findOne(options: FindOneOptions<T>): Promise<T> {
    if (hasNoUserScope(this.request)) {
      return this.repository.findOne(options);
    }
    const scopedOptions = convertToScopedOptions<T>(
      options,
      [],
      this.request.user.scope,
    );
    return this.repository.findOne(scopedOptions);
  }

  public async count(options?: FindManyOptions<T>): Promise<number> {
    if (hasNoUserScope(this.request)) {
      return this.repository.count(options);
    }
    const scopedOptions = convertToScopedOptions<T>(
      options,
      [],
      this.request.user.scope,
    );
    return this.repository.count(scopedOptions);
  }

  public createQueryBuilder(alias: string): ScopedQueryBuilder<T> {
    if (hasNoUserScope(this.request)) {
      return new ScopedQueryBuilder(this.repository.createQueryBuilder(alias));
    }
    const qb = this.repository
      .createQueryBuilder(alias)
      .leftJoin(`${alias}.program`, 'program')
      .andWhere(
        `(program."enableScope" = false OR ${alias}.scope LIKE :scope)`,
        {
          scope: `${this.request.user.scope}%`,
        },
      );
    return new ScopedQueryBuilder(qb);
  }
}
