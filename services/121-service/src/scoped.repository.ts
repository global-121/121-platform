import { Request } from 'express';
import {
  DataSource,
  EntityMetadata,
  Like,
  Repository,
  SelectQueryBuilder,
  FindManyOptions,
  FindOneOptions,
} from 'typeorm';
import { EntityTarget } from 'typeorm/common/EntityTarget';
import { RegistrationEntity } from './registration/registration.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { cloneDeep, merge } from 'lodash';

export class ScopedQueryBuilder<T> extends SelectQueryBuilder<T> {
  constructor(query: SelectQueryBuilder<T>) {
    super(query);
    // Copy other properties if needed
  }
  // Would be better if there was a way to give an error before compile time
  where(_condition?: string, _parameters?: any): this {
    // The reason for this error is that you else overwrite the .where of the scoped repository
    throw new Error(
      'The .where method is not allowed for scope repositories. Use .andWhere instead.',
    );
  }
}

type EntityRelations = Record<string, string[]>;

type FindOptionsCombined<T> = FindOneOptions<T> & FindManyOptions<T>;

// TODO: Is there a way to make these arrays strongly typed?
const relationConfig: EntityRelations = {
  IntersolveVisaWalletEntity: ['intersolveVisaCustomer', 'registration'],
  SafaricomRequestEntity: ['transaction', 'registration'],
  IntersolveVoucherEntity: ['image', 'registration'],
};

// TODO use this for any entity that needs to be scoped that related to registration
@Injectable({ scope: Scope.REQUEST, durable: true })
export class ScopedRepository<T> {
  private repository: Repository<T>;
  // public request: Request;

  // Use  for entities that have an INDIRECT relation to registration
  // Else the relation is found automatically in the constructor
  // DECIDE: Is it more confusing than not use this automatic detection? Is it better to always set it manually?
  // Another option is to try to set it automatically for all entities also those with an indrect relation
  // An example of this for IntersolveVisaWalletEntity is ['intersolveVisaCustomer',  'registration']
  public relationArrayToRegistration: string[];

  constructor(
    target: EntityTarget<T>,
    @InjectDataSource() dataSource: DataSource,
    @Inject(REQUEST) private request: Request,
  ) {
    // this.request
    this.repository = dataSource.createEntityManager().getRepository(target);

    if (relationConfig[this.repository.metadata.name]) {
      this.relationArrayToRegistration =
        relationConfig[this.repository.metadata.name];
    } else {
      this.relationArrayToRegistration = [
        this.findDirectRelationToRegistration(this.repository.metadata),
      ];
    }
  }

  private findDirectRelationToRegistration(metadata: EntityMetadata): string {
    // Gets the relations of the entity for which this repository is created
    const relations = metadata.relations.map(
      (relation) => relation.propertyName,
    );
    for (const relation of relations) {
      const relationType =
        metadata.findRelationWithPropertyPath(relation)?.type;
      if (relationType === RegistrationEntity) {
        return relation;
      }
    }
  }

  private getWhereQueryScope(
    options: FindOptionsCombined<T>,
    whereQueryScopeRelated: Record<string, any>,
  ): FindOptionsCombined<T> {
    const optionsCopy = options ? cloneDeep(options) : {};
    for (const relation of [...this.relationArrayToRegistration.reverse()]) {
      whereQueryScopeRelated = {
        [relation]: whereQueryScopeRelated,
      };
    }
    return merge(optionsCopy?.where || {}, whereQueryScopeRelated);
  }

  private getWhereQueryWithScope(
    options: FindOptionsCombined<T>,
  ): FindOptionsCombined<T> {
    const whereQueryScope = { scope: Like(`${this.request.scope}%`) };
    return this.getWhereQueryScope(options, whereQueryScope);
  }

  private getWhereQueryWithScopeEnabled(
    options: FindOptionsCombined<T>,
  ): FindOptionsCombined<T> {
    const whereQueryScopeEnabled = { program: { enableScope: false } };
    return this.getWhereQueryScope(options, whereQueryScopeEnabled);
  }

  private convertToScopedOptions(
    options: FindOptionsCombined<T>,
  ): FindOptionsCombined<T> {
    const whereQueryScope = this.getWhereQueryWithScope(options);
    const whereQueryScopeEnabled = this.getWhereQueryWithScopeEnabled(options);

    const scopedOptions = {
      ...options,
      where: [whereQueryScope, whereQueryScopeEnabled],
    };
    return scopedOptions as FindOptionsCombined<T>;
  }

  public async find(options: FindOptionsCombined<T>): Promise<T[]> {
    if (!this.request?.scope || this.request.scope === '') {
      return this.repository.find(options);
    }
    const scopedOptions = this.convertToScopedOptions(options);
    return this.repository.find(scopedOptions);
  }

  public async findOne(options: FindOptionsCombined<T>): Promise<T> {
    if (!this.request?.scope || this.request.scope === '') {
      return this.repository.findOne(options);
    }
    const scopedOptions = this.convertToScopedOptions(options);
    return this.repository.findOne(scopedOptions);
  }

  public createQueryBuilder(queryBuilderAlias: string): ScopedQueryBuilder<T> {
    let qb = this.repository.createQueryBuilder(queryBuilderAlias);

    if (!this.request?.scope || this.request.scope === '') {
      return new ScopedQueryBuilder(qb);
    }

    if (
      this.relationArrayToRegistration &&
      this.relationArrayToRegistration.length > 0
    ) {
      let joinProperty = queryBuilderAlias;
      for (const relation of this.relationArrayToRegistration) {
        const joinAlias = `scopedata${relation}`;
        qb = qb.leftJoin(`${joinProperty}.${relation}`, joinAlias);
        joinProperty = joinAlias;
      }
      qb = qb.leftJoin(`${joinProperty}.program`, 'scopedataprogramjoin');
      console.log('joinAlias: ', joinProperty);
      qb = qb.andWhere(
        `(scopedataprogramjoin."enableScope" = false OR ${joinProperty}.scope LIKE :scope)`,
        {
          scope: `${this.request.scope}%`,
        },
      );
    }
    return new ScopedQueryBuilder(qb);
  }
}
