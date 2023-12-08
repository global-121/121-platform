import { RegistrationEntity } from './registration.entity';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { Request } from 'express';
import {
  DataSource,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { ScopedQueryBuilder } from '../scoped.repository';
import { REQUEST } from '@nestjs/core';
import { RegistrationViewEntity } from './registration-view.entity';
import { convertToScopedOptions } from '../utils/scope/createFindWhereOptions.helper';

export class RegistrationScopedBaseRepository<T> {
  public readonly repository: Repository<T>;
  public request: Request;

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

  public createQueryBuilder(alias: string): ScopedQueryBuilder<T> {
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

@Injectable({ scope: Scope.REQUEST, durable: true })
export class RegistrationScopedRepository extends RegistrationScopedBaseRepository<RegistrationEntity> {
  constructor(
    dataSource: DataSource,
    // TODO check if this can be set on ScopedRepository so it can be reused
    @Inject(REQUEST) public request: Request,
  ) {
    super(RegistrationEntity, dataSource);
  }
}

@Injectable({ scope: Scope.REQUEST, durable: true })
export class RegistrationViewScopedRepository extends RegistrationScopedBaseRepository<RegistrationViewEntity> {
  constructor(
    dataSource: DataSource,
    // TODO check if this can be set on ScopedRepository so it can be reused
    @Inject(REQUEST) public request: Request,
  ) {
    super(RegistrationViewEntity, dataSource);
  }
}
