import { Request } from 'express';
import {
  DataSource,
  DeepPartial,
  DeleteResult,
  EntityMetadata,
  FindOptionsWhere,
  InsertResult,
  ObjectId,
  RemoveOptions,
  Repository,
  SaveOptions,
  SelectQueryBuilder,
  UpdateResult,
} from 'typeorm';
import { EntityTarget } from 'typeorm/common/EntityTarget';
import { RegistrationEntity } from './registration/registration.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import {
  FindOptionsCombined,
  convertToScopedOptions,
} from './utils/scope/createFindWhereOptions.helper';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export class ScopedQueryBuilder<T> extends SelectQueryBuilder<T> {
  constructor(query: SelectQueryBuilder<T>) {
    super(query);
    // Copy other properties if needed
  }
  // Would be better if there was a way to give an error before compile time
  where(_condition?: string, _parameters?: any): this {
    // The reason for this error is that you else overwrite the .where of the scoped repository
    const errorText =
      'ERROR: The .where method is not allowed for scope repositories. Use .andWhere instead.';
    console.log(errorText);
    throw new Error(errorText);
  }
}

type EntityRelations = Record<string, string[]>;
// Define here any entities that do have an INDIRECT relation to registration
const indirectRelationConfig: EntityRelations = {
  IntersolveVisaWalletEntity: ['intersolveVisaCustomer', 'registration'],
  SafaricomRequestEntity: ['transaction', 'registration'],
  IntersolveVoucherEntity: ['image', 'registration'],
};

@Injectable({ scope: Scope.REQUEST, durable: true })
export class ScopedRepository<T> {
  private repository: Repository<T>;

  // Use for entities that have an INDIRECT relation to registration
  // Else the relation is found automatically in the constructor
  public relationArrayToRegistration: string[];

  constructor(
    target: EntityTarget<T>,
    @InjectDataSource() dataSource: DataSource,
    @Inject(REQUEST) private request: Request,
  ) {
    this.repository = dataSource.createEntityManager().getRepository(target);

    if (indirectRelationConfig[this.repository.metadata.name]) {
      this.relationArrayToRegistration =
        indirectRelationConfig[this.repository.metadata.name];
    } else {
      this.relationArrayToRegistration = [
        this.findDirectRelationToRegistration(this.repository.metadata),
      ];
    }
  }

  ////////////////////////////////////////////////////////////////
  // CUSTOM IMPLEMENTATION OF REPOSITORY METHODS ////////////////
  //////////////////////////////////////////////////////////////

  public async find(options?: FindOptionsCombined<T>): Promise<T[]> {
    if (!this.request?.scope || this.request.scope === '') {
      return this.repository.find(options);
    }
    const scopedOptions = convertToScopedOptions<T>(
      options,
      this.relationArrayToRegistration,
      this.request.scope,
    );
    return this.repository.find(scopedOptions);
  }

  public async findAndCount(
    options: FindOptionsCombined<T>,
  ): Promise<[T[], number]> {
    if (!this.request?.scope || this.request.scope === '') {
      return this.repository.findAndCount(options);
    }
    const scopedOptions = convertToScopedOptions<T>(
      options,
      this.relationArrayToRegistration,
      this.request.scope,
    );
    return this.repository.findAndCount(scopedOptions);
  }

  public async findOne(options: FindOptionsCombined<T>): Promise<T> {
    if (!this.request?.scope || this.request.scope === '') {
      return this.repository.findOne(options);
    }
    const scopedOptions = convertToScopedOptions<T>(
      options,
      this.relationArrayToRegistration,
      this.request.scope,
    );
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
      qb = qb.andWhere(
        `(scopedataprogramjoin."enableScope" = false OR ${joinProperty}.scope LIKE :scope)`,
        {
          scope: `${this.request.scope}%`,
        },
      );
    }
    return new ScopedQueryBuilder(qb);
  }

  ////////////////////////////////////////////////////////////////
  // COPIED IMPLEMENTATION OF REPOSITORY METHODS ////////////////
  //////////////////////////////////////////////////////////////
  public async save(
    entity: T,
    options: SaveOptions & { reload: false },
  ): Promise<T>;
  public async save(entity: T, options?: SaveOptions): Promise<T>;
  public async save(
    entities: T[],
    options: SaveOptions & { reload: false },
  ): Promise<T[]>;
  public async save(entities: T[], options?: SaveOptions): Promise<T[]>;
  public async save(
    entityOrEntities: T | T[],
    options?: SaveOptions,
  ): Promise<T | T[]> {
    return this.repository.save(entityOrEntities as any, options);
  }

  public async insert(
    entityOrEntities: QueryDeepPartialEntity<T> | QueryDeepPartialEntity<T>[],
  ): Promise<InsertResult> {
    return this.repository.insert(entityOrEntities as any);
  }

  public async remove(entity: T, options?: RemoveOptions): Promise<T>;
  public async remove(entities: T[], options?: RemoveOptions): Promise<T[]>;
  public async remove(
    entityOrEntities: T | T[],
    options?: RemoveOptions,
  ): Promise<T | T[]> {
    return this.repository.remove(entityOrEntities as any, options);
  }

  // I did not apply the scope to this method as it was never needed
  // To make this clear I added Unscoped to the name so it is alway a conscious decision
  public async deleteUnscoped(
    criteria:
      | FindOptionsWhere<T>
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectId
      | ObjectId[],
  ): Promise<DeleteResult> {
    // TODO: This is not scoped yet, for now is doesn't matter as
    // we don't use update anywhere yet in a way where it should be scoped
    // This is as risk though that someone uses this expecting it to be scoped
    return this.repository.delete(criteria);
  }

  // I did not apply the scope to this method as it was never needed
  // To make this clear I added Unscoped to the name so it is alway a conscious decision
  public async updateUnscoped(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectId
      | ObjectId[]
      | FindOptionsWhere<T>,
    partialEntity: QueryDeepPartialEntity<T>,
  ): Promise<UpdateResult> {
    // TODO: This is not scoped yet, for now is doesn't matter as
    // we don't use update anywhere yet in a way where it should be scoped
    // This is as risk though that someone uses this expecting it to be scoped
    return this.repository.update(criteria, partialEntity);
  }

  public create(entityLike: DeepPartial<T>): T;
  public create(entityLikeArray: DeepPartial<T>[]): T[];
  public create(entityLikeOrArray: DeepPartial<T> | DeepPartial<T>[]): T | T[] {
    if (Array.isArray(entityLikeOrArray)) {
      return this.repository.create(entityLikeOrArray as DeepPartial<T>[]);
    } else {
      return this.repository.create(entityLikeOrArray as DeepPartial<T>);
    }
  }

  ////////////////////////////////////////////////////////////////
  // PRIVATE METHODS TO ENABLE SCOPED QUERIES ///////////////////
  //////////////////////////////////////////////////////////////

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
}
