import { RegistrationEntity } from './registration.entity';
import { Inject, Injectable, Scope } from '@nestjs/common';

import { Request } from 'express';
import {
  DataSource,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  Like,
  Repository,
  SaveOptions,
} from 'typeorm';
import { ScopedQueryBuilder } from '../scoped.repository';
import { REQUEST } from '@nestjs/core';
import { RegistrationViewEntity } from './registration-view.entity';

export class RegistrationScopedBaseRepository<T> {
  public readonly repository: Repository<T>;
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
    return this.repository.find(scopedOptions as FindManyOptions);
  }

  public async findOne(options: FindOneOptions<T>): Promise<T> {
    const scopedOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        scope: Like(`${this.request.scope}%`),
      },
    };
    return this.repository.findOne(scopedOptions as FindOneOptions);
  }

  public createQueryBuilder(alias: string): ScopedQueryBuilder<T> {
    const qb = this.repository
      .createQueryBuilder(alias)
      .andWhere(`${alias}.scope LIKE :scope`, {
        scope: `${this.request.scope}%`,
      });
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
  public async save(
    registration: RegistrationEntity,
    options?: SaveOptions,
  ): Promise<RegistrationEntity> {
    // Checking of scoped for save should happen with the DTO
    return this.repository.save(registration, options);
  }
  public async remove(
    registration: RegistrationEntity,
  ): Promise<RegistrationEntity> {
    return this.repository.remove(registration);
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
