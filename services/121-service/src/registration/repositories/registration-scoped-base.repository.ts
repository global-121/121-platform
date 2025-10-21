import {
  DataSource,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { FindReturnType } from 'typeorm/find-options/FindReturnType';

import {
  hasUserScope,
  ScopedQueryBuilder,
} from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { convertToScopedOptions } from '@121-service/src/utils/scope/createFindWhereOptions.helper';

export class RegistrationScopedBaseRepository<T extends ObjectLiteral> {
  public readonly repository: Repository<T>;
  public request: ScopedUserRequest;

  constructor(target: EntityTarget<T>, dataSource: DataSource) {
    this.repository = dataSource.createEntityManager().getRepository(target);
  }

  public async find<Options extends FindManyOptions<T>>(
    options?: Options,
  ): Promise<FindReturnType<T, (Options as any)['select'], (Options as any)['relations']>[]> {
    if (!hasUserScope(this.request)) {
      return this.repository.find(options);
    }
    const scopedOptions = convertToScopedOptions<T, Options>(
      options,
      [],
      this.request.user.scope,
    );
    return this.repository.find(scopedOptions);
  }

  public async findOne<Options extends FindOneOptions<T>>(
    options: Options,
  ): Promise<FindReturnType<
    T,
    (Options as any)['select'],
    (Options as any)['relations']
  > | null> {
    if (!hasUserScope(this.request)) {
      return this.repository.findOne(options);
    }
    const scopedOptions = convertToScopedOptions<T, Options>(
      options,
      [],
      this.request.user.scope,
    );
    return this.repository.findOne(scopedOptions);
  }

  public async findOneOrFail<Options extends FindOneOptions<T>>(
    options: Options,
  ): Promise<FindReturnType<T, (Options as any)['select'], (Options as any)['relations']>> {
    if (!hasUserScope(this.request)) {
      return this.repository.findOneOrFail(options);
    }
    const scopedOptions = convertToScopedOptions<T, Options>(
      options,
      [],
      this.request.user.scope,
    );
    return this.repository.findOneOrFail(scopedOptions);
  }

  public async count<Options extends FindManyOptions<T>>(
    options?: Options,
  ): Promise<number> {
    if (!hasUserScope(this.request)) {
      return this.repository.count(options);
    }

    const scopedOptions = convertToScopedOptions<T, Options>(
      options,
      [],
      this.request.user.scope,
    );

    return this.repository.count(scopedOptions);
  }

  public createQueryBuilder(alias: string): ScopedQueryBuilder<T> {
    if (!hasUserScope(this.request)) {
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
