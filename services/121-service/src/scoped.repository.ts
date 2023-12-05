import { Request } from 'express';
import {
  DataSource,
  EntityMetadata,
  FindManyOptions,
  Repository,
  SaveOptions,
  SelectQueryBuilder,
} from 'typeorm';
import { EntityTarget } from 'typeorm/common/EntityTarget';
import { RegistrationEntity } from './registration/registration.entity';
import { InjectDataSource } from '@nestjs/typeorm';

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

// TODO use this for any entity that needs to be scoped that related to registration
export class ScopedRepository<T> {
  private repository: Repository<T>;
  public request: Request;

  // Use for entities that have an INDIRECT relation to registration
  // Else the relation is found automatically in the constructor
  // DECIDE: Is it more confusing than not use this automatic detection? Is it better to always set it manually?
  // An example of this for IntersolveVisaWalletEntity is ['intersolveVisaCustomer',  'registration']
  public relationArrayToRegistration: string[];

  constructor(
    target: EntityTarget<T>,
    @InjectDataSource() dataSource: DataSource,
    relationToRegistration?: string[],
  ) {
    this.repository = dataSource.createEntityManager().getRepository(target);
    if (!relationToRegistration || relationToRegistration.length === 0) {
      this.relationArrayToRegistration = [
        this.findDirectRelationToRegistration(this.repository.metadata),
      ];
    } else {
      this.relationArrayToRegistration = relationToRegistration;
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

  public async find(options: FindManyOptions<T>): Promise<T[]> {
    console.log('options: ', options);
    console.log('this.request.scope: ', this.request.scope);
    // replace this for a query builder option else the related registration entities are always selected
    // Or first select them and then filter them out
    // Or remove this function in general and always use the query builder
    return this.repository.find(options as any);
  }

  // I dont think .save needs scope checks for the question: am I allowed to update registrationData of this registration?
  // Because we normally get the registration first and then save the related entity
  // Maybe there are some edge cases where this is not true?
  public async save(entity: any, options?: SaveOptions): Promise<T | T[]> {
    return this.repository.save(entity, options);
  }

  public createQueryBuilder(queryBuilderAlias: string): ScopedQueryBuilder<T> {
    let qb = this.repository.createQueryBuilder(queryBuilderAlias);

    // If the scope is empty, return the normal query builder
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
      console.log('joinAlias: ', joinProperty);
      qb = qb.andWhere(`${joinProperty}.scope LIKE :scope`, {
        scope: `${this.request.scope}%`,
      });
    }
    return new ScopedQueryBuilder(qb);
  }
}
