import {
  DataSource,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  ObjectLiteral,
  Repository,
} from 'typeorm';

import { addAccessGroupFilter } from '@121-service/src/programs/access-group-levels/access-group-filter.helper';
import {
  requestHasUser,
  ScopedQueryBuilder,
} from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { FindReturnType } from '@121-service/src/shared/types/find-return.type';
import { addScopeFilter } from '@121-service/src/utils/scope/scope-filter.helper';

export class RegistrationScopedBaseRepository<T extends ObjectLiteral> {
  public readonly repository: Repository<T>;
  public request: ScopedUserRequest;

  constructor(target: EntityTarget<T>, dataSource: DataSource) {
    this.repository = dataSource.createEntityManager().getRepository(target);
  }

  public async find<Options extends FindManyOptions<T>>(
    options?: Options,
  ): Promise<FindReturnType<T, Options['select'], Options['relations']>[]> {
    if (!requestHasUser(this.request)) {
      return this.repository.find(options);
    }
    const scopedResult = await this.createFindQueryBuilder({
      options,
    }).getMany();
    return scopedResult as FindReturnType<
      T,
      Options['select'],
      Options['relations']
    >[];
  }

  public async findOne<Options extends FindOneOptions<T>>(
    options: Options,
  ): Promise<FindReturnType<
    T,
    Options['select'],
    Options['relations']
  > | null> {
    if (!requestHasUser(this.request)) {
      return this.repository.findOne(options);
    }
    const scopedResult = await this.createFindQueryBuilder({
      options: { ...options, take: 1 },
    }).getOne();
    return scopedResult as FindReturnType<
      T,
      Options['select'],
      Options['relations']
    > | null;
  }

  public async findOneOrFail<Options extends FindOneOptions<T>>(
    options: Options,
  ): Promise<FindReturnType<T, Options['select'], Options['relations']>> {
    if (!requestHasUser(this.request)) {
      return this.repository.findOneOrFail(options);
    }
    const scopedResult = await this.createFindQueryBuilder({
      options: { ...options, take: 1 },
    }).getOneOrFail();
    return scopedResult as FindReturnType<
      T,
      Options['select'],
      Options['relations']
    >;
  }

  public async count<Options extends FindManyOptions<T>>(
    options?: Options,
  ): Promise<number> {
    if (!requestHasUser(this.request)) {
      return this.repository.count(options);
    }
    return await this.createFindQueryBuilder({ options }).getCount();
  }

  public createQueryBuilder(alias: string): ScopedQueryBuilder<T> {
    const queryBuilder = this.repository.createQueryBuilder(alias);
    if (!requestHasUser(this.request)) {
      return new ScopedQueryBuilder(queryBuilder);
    }

    queryBuilder.leftJoin(`${alias}.program`, 'program');
    addScopeFilter({
      queryBuilder,
      registrationAlias: alias,
      programAlias: 'program',
      scope: this.request.user.scope,
    });
    addAccessGroupFilter({
      queryBuilder,
      registrationAlias: alias,
      accessGroups: this.request.user.accessGroups,
    });
    return new ScopedQueryBuilder(queryBuilder);
  }

  private createFindQueryBuilder({
    options,
  }: {
    options?: FindManyOptions<T>;
  }): ScopedQueryBuilder<T> {
    return this.createQueryBuilder(
      this.repository.metadata.name,
    ).setFindOptions(options ?? {});
  }
}
