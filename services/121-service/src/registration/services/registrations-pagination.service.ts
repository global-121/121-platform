import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { FilterComparator, parseFilter } from 'nestjs-paginate/lib/filter';
import {
  Brackets,
  FindOperator,
  Repository,
  SelectQueryBuilder,
  WhereExpressionBuilder,
} from 'typeorm';
import { ProgramService } from '../../programs/programs.service';
import {
  RegistrationDataInfo,
  RegistrationDataRelation,
} from '../dto/registration-data-relation.model';
import { RegistrationDataEntity } from '../registration-data.entity';
import { RegistrationViewEntity } from '../registration-view.entity';

const allowedFilterOperators = [
  FilterOperator.EQ,
  FilterOperator.IN,
  FilterOperator.ILIKE,
  FilterOperator.NULL,
];

export const paginateConfig: PaginateConfig<RegistrationViewEntity> = {
  maxLimit: 10000,
  relations: ['data'],
  searchableColumns: ['data.(value)'],
  sortableColumns: [
    'id',
    'status',
    'referenceId',
    'phoneNumber',
    'preferredLanguage',
    'inclusionScore',
    'paymentAmountMultiplier',
    'note',
    'noteUpdated',
    'financialServiceProvider',
    'registrationProgramId',
    'maxPayments',
    'data.(value)',
  ],
  filterableColumns: {
    referenceId: allowedFilterOperators,
    status: allowedFilterOperators,
    id: allowedFilterOperators,
    phoneNumber: allowedFilterOperators,
    preferredLanguage: allowedFilterOperators,
    inclusionScore: allowedFilterOperators,
    paymentAmountMultiplier: allowedFilterOperators,
    note: allowedFilterOperators,
    noteUpdated: allowedFilterOperators,
    financialServiceProvider: allowedFilterOperators,
    registrationProgramId: allowedFilterOperators,
    maxPayments: allowedFilterOperators,
  },
};

type Filter = {
  comparator: FilterComparator;
  findOperator: FindOperator<string>;
};
type ColumnsFilters = { [columnName: string]: Filter[] };

@Injectable()
export class RegistrationsPaginationService {
  @InjectRepository(RegistrationViewEntity)
  private readonly registrationViewRepository: Repository<RegistrationViewEntity>;

  public constructor(private readonly programService: ProgramService) {}

  public async getPaginate(
    query: PaginateQuery,
    programId: number,
  ): Promise<Paginated<RegistrationViewEntity>> {
    let queryBuilder = this.registrationViewRepository
      .createQueryBuilder('registration')
      .where('"programId" = :programId', { programId: programId });

    const registrationDataRelations =
      await this.programService.getAllRelationProgram(programId);
    const registrationDataNamesProgram = registrationDataRelations.map(
      (r) => r.name,
    );

    // Check if the filter contains at least one registration data name
    if (
      query.filter &&
      registrationDataNamesProgram.some((key) =>
        Object.keys(query.filter).includes(key),
      )
    ) {
      queryBuilder = this.filterOnRegistrationData(
        query,
        queryBuilder,
        registrationDataRelations,
        registrationDataNamesProgram,
      );
    }

    // PaginateConfig.select and PaginateConfig.relations cannot be used in combi with each other
    // That's why we wrote some manual code to do the selection
    const result = await paginate<RegistrationViewEntity>(
      query,
      queryBuilder,
      paginateConfig,
    );

    // Custom code is written here to filter on query.select since it does not work with query.relations
    let registrationDataRelationsSelect = [...registrationDataRelations];
    if (query.select && query.select.length > 0) {
      registrationDataRelationsSelect = registrationDataRelationsSelect.filter(
        (relation) => query.select.includes(relation.name),
      );
    }

    result.data = this.mapPaginatedEntity(
      result,
      registrationDataRelationsSelect,
      query.select,
    );
    return result;
  }

  private filterOnRegistrationData(
    query: PaginateQuery,
    queryBuilder: SelectQueryBuilder<RegistrationViewEntity>,
    registrationDataRelations: RegistrationDataInfo[],
    registrationDataNamesProgram: string[],
  ): SelectQueryBuilder<RegistrationViewEntity> {
    const filterableColumnsRegData = this.createFilterObjectRegistrationData(
      registrationDataNamesProgram,
    );
    const parsedFilter = parseFilter(query, filterableColumnsRegData);
    return this.filterRegistrationDataQb(
      queryBuilder,
      registrationDataRelations,
      parsedFilter,
    );
  }

  private createFilterObjectRegistrationData(
    registrationDataNamesProgram: string[],
  ): { [column: string]: FilterOperator[] | true } {
    const filterObject = {};
    for (const name of registrationDataNamesProgram) {
      filterObject[name] = allowedFilterOperators;
    }
    return filterObject;
  }

  private filterRegistrationDataQb(
    queryBuilder: SelectQueryBuilder<RegistrationViewEntity>,
    registrationDataRelations: RegistrationDataInfo[],
    parsedFilter: ColumnsFilters,
  ): SelectQueryBuilder<RegistrationViewEntity> {
    for (const [filterKey, filters] of Object.entries(parsedFilter)) {
      const relationInfoArray = registrationDataRelations.filter(
        (r) => r.name === filterKey,
      );
      for (const filter of filters) {
        if (
          ['equal', 'in', 'ilike', 'isNull'].includes(filter.findOperator.type)
        ) {
          const uniqueJoinId = Array.from({ length: 25 }, () =>
            'abcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 26)),
          ).join('');
          queryBuilder.leftJoin('registration.data', uniqueJoinId);
          queryBuilder = this.applyFilterConditionRegData(
            queryBuilder,
            filter.findOperator.type,
            filter.findOperator.value,
            uniqueJoinId,
          );
          queryBuilder.andWhere(
            new Brackets((qb) => {
              this.whereRegistrationDataIsOneOfIds(
                relationInfoArray,
                qb,
                uniqueJoinId,
              );
            }),
          );
        }
      }
    }
    return queryBuilder;
  }

  private applyFilterConditionRegData(
    queryBuilder: SelectQueryBuilder<RegistrationViewEntity>,
    filterType: string,
    value: any,
    uniqueJoinId: string,
  ): SelectQueryBuilder<RegistrationViewEntity> {
    const columnName = 'value';
    switch (filterType) {
      case 'equal':
        return queryBuilder.andWhere(
          `${uniqueJoinId}.${columnName} = :value${uniqueJoinId}`,
          { [`value${uniqueJoinId}`]: value },
        );
      case 'in':
        return queryBuilder.andWhere(
          `${uniqueJoinId}.${columnName} IN (:...value${uniqueJoinId})`,
          { [`value${uniqueJoinId}`]: value },
        );
      case 'ilike':
        return queryBuilder.andWhere(
          `${uniqueJoinId}.${columnName} ILIKE :value${uniqueJoinId}`,
          { [`value${uniqueJoinId}`]: `%${value}%` },
        );
      case 'isNull':
        return queryBuilder.andWhere(`${uniqueJoinId}.${columnName} IS NULL`);
    }
  }

  private whereRegistrationDataIsOneOfIds(
    relationInfoArray: RegistrationDataInfo[],
    qb: WhereExpressionBuilder,
    uniqueJoinId: string,
  ): void {
    let i = 0;
    for (const relationInfo of relationInfoArray) {
      for (const [dataRelKey, id] of Object.entries(relationInfo.relation)) {
        if (i === 0) {
          qb.where(`${uniqueJoinId}."${dataRelKey}" = :id${uniqueJoinId}`, {
            [`id${uniqueJoinId}`]: id,
          });
        } else {
          qb.orWhere(`${uniqueJoinId}."${dataRelKey}" = :id${uniqueJoinId}`, {
            [`id${uniqueJoinId}`]: id,
          });
        }
      }
      i++;
    }
  }

  private mapPaginatedEntity(
    paginatedResult: Paginated<RegistrationViewEntity>,
    registrationDataRelations: RegistrationDataInfo[],
    select: string[],
  ): RegistrationViewEntity[] {
    const mappedData: RegistrationViewEntity[] = [];
    for (const registration of paginatedResult.data) {
      const mappedRootRegistration = this.mapRootRegistration(
        registration,
        select,
      );
      // Add personal data permission check here
      const mappedRegistration = this.mapRegistrationData(
        registration.data,
        mappedRootRegistration,
        registrationDataRelations,
      );
      mappedData.push(mappedRegistration);
    }
    return mappedData;
  }

  private mapRootRegistration(
    registration: RegistrationViewEntity,
    select: string[],
  ): RegistrationViewEntity {
    let mappedRegistration: RegistrationViewEntity;
    if (select && select.length > 0) {
      mappedRegistration = new RegistrationViewEntity();
      for (const selectKey of select) {
        if (registration[selectKey] !== undefined) {
          mappedRegistration[selectKey] = registration[selectKey];
        }
      }
    } else {
      mappedRegistration = { ...registration };
    }
    delete mappedRegistration.data;
    return mappedRegistration;
  }

  private mapRegistrationData(
    registrationDataArray: RegistrationDataEntity[],
    mappedRegistration: RegistrationViewEntity,
    registrationDataInfoArray: RegistrationDataInfo[],
  ): RegistrationViewEntity {
    if (!registrationDataArray || registrationDataArray.length < 1) {
      return mappedRegistration;
    }
    const findRelation = (
      dataRelation: RegistrationDataRelation,
      data: RegistrationDataEntity,
    ): boolean => {
      const propertiesToCheck = [
        'programQuestionId',
        'fspQuestionId',
        'programCustomAttributeId',
        'monitoringQuestionId',
      ];
      for (const property of propertiesToCheck) {
        if (
          dataRelation[property] === data[property] &&
          data[property] !== null
        ) {
          return true;
        }
      }
      return false;
    };
    for (const registrationData of registrationDataArray) {
      const dataRelation = registrationDataInfoArray.find((x) =>
        findRelation(x.relation, registrationData),
      );
      if (dataRelation && dataRelation.name) {
        mappedRegistration[dataRelation.name] = registrationData.value;
      }
    }
    return mappedRegistration;
  }
}
