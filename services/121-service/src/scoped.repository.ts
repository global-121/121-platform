import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import {
  DeleteResult,
  EntityMetadata,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  InsertResult,
  ObjectId,
  ObjectLiteral,
  RemoveOptions,
  Repository,
  SaveOptions,
  SelectQueryBuilder,
  UpdateResult,
} from 'typeorm';
import { FindReturnType } from 'typeorm/find-options/FindReturnType';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import {
  ScopedUserRequest,
  ScopedUserRequestWithUser,
} from '@121-service/src/shared/scoped-user-request';
import { convertToScopedOptions } from '@121-service/src/utils/scope/createFindWhereOptions.helper';

export class ScopedQueryBuilder<
  T extends ObjectLiteral,
> extends SelectQueryBuilder<T> {
  constructor(query: SelectQueryBuilder<T>) {
    super(query);
    // Copy other properties if needed
  }
  // Would be better if there was a way to give an error before runtime
  override where(): this {
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
  IntersolveVisaChildWalletEntity: [
    'intersolveVisaParentWallet',
    'intersolveVisaCustomer',
    'registration',
  ],
  IntersolveVisaParentWalletEntity: ['intersolveVisaCustomer', 'registration'],
  SafaricomTransferEntity: ['transaction', 'registration'],
  IntersolveVoucherEntity: ['image', 'registration'],
};

export function hasUserScope(
  req: ScopedUserRequest,
): req is ScopedUserRequestWithUser {
  return req?.user != undefined && req.user.scope !== '';
}

@Injectable({ scope: Scope.REQUEST, durable: true })
export class ScopedRepository<T extends ObjectLiteral> extends Repository<T> {
  // Use for entities that have an INDIRECT relation to registration
  // Else the relation is found automatically in the constructor
  public relationArrayToRegistration: string[];

  constructor(
    @Inject(REQUEST) private request: ScopedUserRequest,
    private repository: Repository<T>,
  ) {
    if (repository instanceof ScopedRepository) {
      throw new Error(
        'Invalid repository type: ScopedRepository should not be passed to a ScopedRepository constructor.',
      );
    }
    super(repository.target, repository.manager, repository.queryRunner);
    if (indirectRelationConfig[this.repository.metadata.name]) {
      this.relationArrayToRegistration =
        indirectRelationConfig[this.repository.metadata.name];
    } else {
      this.relationArrayToRegistration = [];
      const directRelationToRegistration =
        this.findDirectRelationToRegistration(this.repository.metadata);
      if (directRelationToRegistration) {
        this.relationArrayToRegistration.push(directRelationToRegistration);
      }
    }
  }

  ////////////////////////////////////////////////////////////////
  // CUSTOM IMPLEMENTATION OF REPOSITORY METHODS ////////////////
  //////////////////////////////////////////////////////////////

  public override async find<Options extends FindManyOptions<T>>(
    options?: Options,
  ): Promise<FindReturnType<T, Options['select'], Options['relations']>[]> {
    if (!hasUserScope(this.request)) {
      return this.repository.find(options);
    }
    const scopedOptions = convertToScopedOptions<T, Options>(
      options,
      this.relationArrayToRegistration,
      this.request.user.scope,
    );
    return this.repository.find(scopedOptions);
  }

  public override async findAndCount<Options extends FindManyOptions<T>>(
    options?: Options,
  ): Promise<
    [FindReturnType<T, Options['select'], Options['relations']>[], number]
  > {
    if (!hasUserScope(this.request)) {
      return this.repository.findAndCount(options); // Pass undefined directly if no scope
    }

    const scopedOptions = convertToScopedOptions<T, Options>(
      options,
      this.relationArrayToRegistration,
      this.request.user.scope,
    );
    return this.repository.findAndCount(scopedOptions);
  }

  public override async findOne<Options extends FindOneOptions<T>>(
    options: Options,
  ): Promise<FindReturnType<
    T,
    Options['select'],
    Options['relations']
  > | null> {
    if (!hasUserScope(this.request)) {
      return this.repository.findOne(options);
    }

    const scopedOptions = convertToScopedOptions<T, Options>(
      options,
      this.relationArrayToRegistration,
      this.request.user.scope,
    );
    return this.repository.findOne(scopedOptions);
  }

  public override async findOneOrFail<Options extends FindOneOptions<T>>(
    options: Options,
  ): Promise<FindReturnType<T, Options['select'], Options['relations']>> {
    if (!hasUserScope(this.request)) {
      return this.repository.findOneOrFail(options);
    }

    const scopedOptions = convertToScopedOptions<T, Options>(
      options,
      this.relationArrayToRegistration,
      this.request.user.scope,
    );
    return this.repository.findOneOrFail(scopedOptions);
  }

  public override createQueryBuilder(
    queryBuilderAlias: string,
  ): ScopedQueryBuilder<T> {
    let qb = this.repository.createQueryBuilder(queryBuilderAlias);

    if (!hasUserScope(this.request)) {
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
          scope: `${this.request.user.scope}%`,
        },
      );
    }
    return new ScopedQueryBuilder(qb);
  }

  ////////////////////////////////////////////////////////////////
  // COPIED IMPLEMENTATION OF REPOSITORY METHODS ////////////////
  //////////////////////////////////////////////////////////////
  public override async save(
    entity: T,
    options: SaveOptions & { reload: false },
  ): Promise<T>;
  public override async save(entity: T, options?: SaveOptions): Promise<T>;
  public override async save(
    entities: T[],
    options: SaveOptions & { reload: false },
  ): Promise<T[]>;
  public override async save(
    entities: T[],
    options?: SaveOptions,
  ): Promise<T[]>;
  public override async save(
    entityOrEntities: T | T[],
    options?: SaveOptions,
  ): Promise<T | T[]> {
    return this.repository.save(
      entityOrEntities as Parameters<Repository<T>['save']>[0],
      options,
    );
  }

  public override async insert(
    entityOrEntities: QueryDeepPartialEntity<T> | QueryDeepPartialEntity<T>[],
  ): Promise<InsertResult> {
    return this.repository.insert(entityOrEntities);
  }

  public override async remove(entity: T, options?: RemoveOptions): Promise<T>;
  public override async remove(
    entities: T[],
    options?: RemoveOptions,
  ): Promise<T[]>;
  public override async remove(
    entityOrEntities: T | T[],
    options?: RemoveOptions,
  ): Promise<T | T[]> {
    return this.repository.remove(
      entityOrEntities as Parameters<Repository<T>['remove']>[0],
      options,
    );
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

  ////////////////////////////////////////////////////////////////
  // PRIVATE METHODS TO ENABLE SCOPED QUERIES ///////////////////
  //////////////////////////////////////////////////////////////

  private findDirectRelationToRegistration(
    metadata: EntityMetadata,
  ): string | undefined {
    // Gets the relations of the entity for which this repository is created
    if (!metadata?.relations) {
      return;
    }

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

    return undefined;
  }
}
