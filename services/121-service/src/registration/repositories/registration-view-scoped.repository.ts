import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FilterComparator } from 'nestjs-paginate/lib/filter';
import {
  Brackets,
  DataSource,
  FindOperator,
  FindOperatorType,
  Not,
} from 'typeorm';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationDataInfo } from '@121-service/src/registration/dto/registration-data-relation.model';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationViewRepositoryHelper } from '@121-service/src/registration/repositories/helpers/registration-view.repository.helper';
import { RegistrationScopedBaseRepository } from '@121-service/src/registration/repositories/registration-scoped-base.repository';
import { ScopedQueryBuilder } from '@121-service/src/scoped.repository';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

interface Filter {
  comparator: FilterComparator;
  findOperator: FindOperator<string>;
}
type ColumnsFilters = Record<string, Filter[]>;

// TODO: Unit tests for this class should be created
@Injectable({ scope: Scope.REQUEST, durable: true })
export class RegistrationViewScopedRepository extends RegistrationScopedBaseRepository<RegistrationViewEntity> {
  constructor(
    dataSource: DataSource,
    // TODO check if this can be set on ScopedRepository so it can be reused
    @Inject(REQUEST) public request: ScopedUserRequest,
  ) {
    super(RegistrationViewEntity, dataSource);
  }

  public getQueryBuilderForFspInstructions({
    programId,
    payment,
    programFspConfigurationId,
    fspName,
    status,
  }: {
    programId: number;
    payment: number;
    programFspConfigurationId?: number;
    fspName?: Fsps;
    status?: TransactionStatusEnum;
  }): ScopedQueryBuilder<RegistrationViewEntity> {
    const query = this.createQueryBuilder('registration')
      .innerJoin('registration.latestTransactions', 'latestTransaction')
      .innerJoin('latestTransaction.transaction', 'transaction')
      .andWhere('registration.programId = :programId', { programId })
      .andWhere('transaction.payment = :payment', { payment })
      .orderBy('registration.referenceId', 'ASC');
    if (status) {
      query.andWhere('transaction.status = :status', { status });
    }
    if (programFspConfigurationId) {
      query.andWhere(
        'transaction.programFspConfigurationId = :programFspConfigurationId',
        { programFspConfigurationId },
      );
    }
    if (fspName) {
      query
        .leftJoin(
          'transaction.programFspConfiguration',
          'programFspConfiguration',
        )
        .andWhere('programFspConfiguration.fspName = :fspName', { fspName });
    }
    return query;
  }

  public createQueryBuilderToGetRegistrationViewsByReferenceIds(
    referenceIds: string[],
  ): ScopedQueryBuilder<RegistrationViewEntity> {
    if (referenceIds.length === 0) {
      // Always false condition to return no results
      return this.createQueryBuilder('registration').andWhere('1=0');
    }
    return this.createQueryBuilder('registration')
      .andWhere({ status: Not(RegistrationStatusEnum.deleted) })
      .andWhere('registration.referenceId IN (:...referenceIds)', {
        referenceIds,
      });
  }

  public addSearchToQueryBuilder(
    queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>,
    search: string,
  ): ScopedQueryBuilder<RegistrationViewEntity> {
    queryBuilder.leftJoin('registration.data', 'registrationDataSearch');
    queryBuilder.andWhere('registrationDataSearch.value ILIKE :search', {
      search: `%${search}%`,
    });
    return queryBuilder;
  }

  public createQueryBuilderExcludeDeleted(): ScopedQueryBuilder<RegistrationViewEntity> {
    return this.createQueryBuilder('registration').andWhere({
      status: Not(RegistrationStatusEnum.deleted),
    });
  }

  public addProgramFilter({
    queryBuilder,
    programId,
  }: {
    queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>;
    programId: number;
  }): ScopedQueryBuilder<RegistrationViewEntity> {
    // Adds a filter for programId to the query builder
    return queryBuilder.andWhere('"registration"."programId" = :programId', {
      programId,
    });
  }

  public sortOnRegistrationData(
    sortByKey: string,
    sortByValue: 'ASC' | 'DESC',
    queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>,
    attributeRelations: RegistrationDataInfo[],
  ): ScopedQueryBuilder<RegistrationViewEntity> {
    const relationInfo = attributeRelations.find((r) => r.name === sortByKey);
    if (!relationInfo) {
      return queryBuilder;
    }
    queryBuilder.leftJoin('registration.data', 'rd');
    queryBuilder.andWhere(
      new Brackets((qb) => {
        RegistrationViewRepositoryHelper.whereRegistrationDataIsOneOfIds(
          relationInfo,
          qb,
          'rd',
        );
      }),
    );
    queryBuilder.orderBy('rd.value', sortByValue);
    queryBuilder.addSelect('rd.value');
    // This is somehow needed (without alias!) to make the orderBy work
    // These values are not returned because they are not mapped later on
    return queryBuilder;
  }

  public filterRegistrationAttributeDataQb({
    queryBuilder,
    attributeRelations,
    parsedFilter,
  }: {
    queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>;
    attributeRelations: RegistrationDataInfo[];
    parsedFilter: ColumnsFilters;
  }): ScopedQueryBuilder<RegistrationViewEntity> {
    for (const [filterKey, filters] of Object.entries(parsedFilter)) {
      const relationInfo = attributeRelations.find((r) => r.name === filterKey);
      if (relationInfo) {
        for (const filter of filters) {
          queryBuilder = this.applySingleAttributeFilter({
            queryBuilder,
            filter,
            relationInfo,
          });
        }
      }
    }
    return queryBuilder;
  }

  private applySingleAttributeFilter({
    queryBuilder,
    filter,
    relationInfo: relationInfo,
  }: {
    queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>;
    filter: Filter;
    relationInfo: RegistrationDataInfo;
  }): ScopedQueryBuilder<RegistrationViewEntity> {
    const operatorTypes: FindOperatorType[] = [
      'equal',
      'in',
      'ilike',
      'isNull',
      'moreThan',
      'lessThan',
      'between',
    ];

    const notOperatorType: FindOperatorType = 'not';

    const findOperator = filter.findOperator;

    const notFilter = findOperator.type === notOperatorType;

    // This is needed to support nested find operators like $not:$ilike
    const findOperatorType = findOperator.child?.type || findOperator.type;

    if (operatorTypes.includes(findOperatorType)) {
      const uniqueJoinId = Array.from({ length: 25 }, () =>
        'abcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 26)),
      ).join('');
      queryBuilder.leftJoin(
        'registration.data', // relation path
        uniqueJoinId, // alias
        `${uniqueJoinId}."programRegistrationAttributeId" = ${relationInfo.relation.programRegistrationAttributeId}`,
      );
      queryBuilder =
        RegistrationViewRepositoryHelper.applyFilterConditionAttributes({
          queryBuilder,
          findOperatorType,
          value: findOperator.value,
          uniqueJoinId,
          notFilter,
        });
    }
    return queryBuilder;
  }
}
