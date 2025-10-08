import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FilterComparator } from 'nestjs-paginate/lib/filter';
import { Brackets, DataSource, FindOperator, FindOperatorType } from 'typeorm';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationDataInfo } from '@121-service/src/registration/dto/registration-data-relation.model';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
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

  // TODO: get rid of this method and use the generic ones
  public getQueryBuilderForFspInstructions({
    programId,
    paymentId,
    programFspConfigurationId,
    fspName,
    status,
  }: {
    programId: number;
    paymentId: number;
    programFspConfigurationId?: number;
    fspName?: Fsps;
    status?: TransactionStatusEnum;
  }): ScopedQueryBuilder<RegistrationViewEntity> {
    const query = this.createQueryBuilder('registration')
      .innerJoin('registration.transactions', 'transaction')
      .andWhere('registration.programId = :programId', { programId })
      .andWhere('transaction.paymentId = :paymentId', { paymentId })
      .orderBy('registration.referenceId', 'ASC');
    if (status) {
      query.andWhere('transaction.status = :status', { status });
    }
    if (programFspConfigurationId) {
      query.andWhere(
        'transaction."programFspConfigurationId" = :programFspConfigurationId',
        { programFspConfigurationId },
      );
    }
    if (fspName) {
      query
        .leftJoin(
          'transaction.programFspConfiguration',
          'programFspConfiguration',
        )
        .andWhere('programFspConfiguration."fspName" = :fspName', { fspName });
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
    return this.queryBuilderFilterDeleted().andWhere(
      'registration.referenceId IN (:...referenceIds)',
      {
        referenceIds,
      },
    );
  }

  public createQueryBuilderToGetByRegistrationDataValues({
    programId,
    programRegistrationAttributeId,
    registrationDataValues,
  }: {
    programId: number;
    programRegistrationAttributeId: number;
    registrationDataValues: string[];
  }): ScopedQueryBuilder<RegistrationViewEntity> {
    return this.queryBuilderFilterDeleted()
      .andWhere('registration.programId = :programId', { programId })
      .leftJoin('registration.data', 'registrationDataFilter')
      .andWhere('registrationDataFilter.id = :id', {
        id: programRegistrationAttributeId,
      })
      .andWhere('registrationDataFilter.value IN (:...values)', {
        values: registrationDataValues,
      });
  }

  private queryBuilderFilterDeleted(): ScopedQueryBuilder<RegistrationViewEntity> {
    return this.createQueryBuilder('registration').andWhere(
      'registration.status IS DISTINCT FROM :deletedStatus',
      {
        deletedStatus: RegistrationStatusEnum.deleted, // The not opereator does not work with null values so we use IS DISTINCT FROM
      },
    );
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
    return this.createQueryBuilder('registration').andWhere(
      'registration.status IS DISTINCT FROM :deletedStatus',
      {
        deletedStatus: RegistrationStatusEnum.deleted,
      },
    );
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

  public async getUniqueFspConfigIdsByPaymentAndRegistrationData({
    paymentId,
    programRegistrationAttributeId,
    dataValues,
  }: {
    paymentId: number;
    programRegistrationAttributeId: number;
    dataValues: (string | number | boolean | undefined)[];
  }): Promise<number[]> {
    const result = await this.createQueryBuilder('registration')
      .select('registration."programFspConfigurationId"')
      .innerJoin('registration.transactions', 'transaction')
      .leftJoin('registration.data', 'registrationData')
      .andWhere('transaction."paymentId" = :paymentId', { paymentId })
      .andWhere(
        '"registrationData"."programRegistrationAttributeId" = :attributeId',
        {
          attributeId: programRegistrationAttributeId,
        },
      )
      .andWhere('"registrationData".value = ANY(:dataValues)', {
        // Use = ANY(...) to prevent query being too long
        dataValues,
      })
      .groupBy('registration."programFspConfigurationId"')
      .getRawMany();
    const uniqueFspConfigIds = result.map((r) => r.programFspConfigurationId);
    return uniqueFspConfigIds;
  }

  public async getTransactionIdsByPaymentAndRegistrationData({
    paymentId,
    programRegistrationAttributeId,
    dataValues,
  }: {
    paymentId: number;
    programRegistrationAttributeId: number;
    dataValues: (string | number | boolean | undefined)[];
  }): Promise<number[]> {
    const result = await this.createQueryBuilder('registration')
      .select('transaction.id', 'transactionId')
      .innerJoin('registration.transactions', 'transaction')
      .leftJoin('registration.data', 'registrationData')
      .andWhere('transaction."paymentId" = :paymentId', { paymentId })
      .andWhere(
        '"registrationData"."programRegistrationAttributeId" = :attributeId',
        {
          attributeId: programRegistrationAttributeId,
        },
      )
      .andWhere('"registrationData".value = ANY(:dataValues)', {
        // Use = ANY(...) to prevent query being too long
        dataValues,
      })
      .getRawMany();
    const transactionIds = result.map((r) => r.transactionId);
    return transactionIds;
  }

  public async getReferenceIdsAndStatusesByPaymentForRegistrationData({
    paymentId,
    programRegistrationAttributeId,
    dataValues,
  }: {
    paymentId: number;
    programRegistrationAttributeId: number;
    dataValues: (string | number | boolean | undefined)[];
  }): Promise<
    { referenceId: string; status: TransactionStatusEnum; value: string }[]
  > {
    return await this.createQueryBuilder('registration')
      .select([
        'registration."referenceId" as "referenceId"',
        'transaction.status as "status"',
        '"registrationData".value as "value"',
      ])
      .innerJoin('registration.transactions', 'transaction')
      .leftJoin('registration.data', 'registrationData')
      .andWhere('transaction."paymentId" = :paymentId', { paymentId })
      .andWhere(
        '"registrationData"."programRegistrationAttributeId" = :attributeId',
        {
          attributeId: programRegistrationAttributeId,
        },
      )
      .andWhere('"registrationData".value = ANY(:dataValues)', {
        // Use = ANY(...) to prevent query being too long
        dataValues,
      })
      .getRawMany();
  }
}
