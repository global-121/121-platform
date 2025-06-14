import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { omit } from 'lodash';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { FilterComparator, parseFilter } from 'nestjs-paginate/lib/filter';
import {
  Brackets,
  Equal,
  FindOperator,
  FindOperatorType,
  Not,
  Repository,
  WhereExpressionBuilder,
} from 'typeorm';

import { FinancialServiceProviders } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramService } from '@121-service/src/programs/programs.service';
import {
  AllowedFilterOperatorsNumber,
  AllowedFilterOperatorsString,
  PaginateConfigRegistrationView,
  PaginateConfigRegistrationViewNoLimit,
} from '@121-service/src/registration/const/filter-operation.const';
import { FindAllRegistrationsResultDto } from '@121-service/src/registration/dto/find-all-registrations-result.dto';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import {
  RegistrationDataInfo,
  RegistrationDataRelation,
} from '@121-service/src/registration/dto/registration-data-relation.model';
import {
  DefaultRegistrationDataAttributeNames,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/registration-attribute-data.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { ScopedQueryBuilder } from '@121-service/src/scoped.repository';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserEntity } from '@121-service/src/user/user.entity';

interface Filter {
  comparator: FilterComparator;
  findOperator: FindOperator<string>;
}
type ColumnsFilters = Record<string, Filter[]>;

@Injectable()
export class RegistrationsPaginationService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;

  public constructor(
    private readonly programService: ProgramService,
    private readonly registrationViewScopedRepository: RegistrationViewScopedRepository,
  ) {}

  public async getPaginate(
    query: PaginateQuery,
    programId: number,
    hasPersonalReadPermission: boolean,
    noLimit: boolean,
    queryBuilder?: ScopedQueryBuilder<RegistrationViewEntity>,
  ): Promise<FindAllRegistrationsResultDto> {
    // Deep clone query here to prevent mutation out of this function
    query = structuredClone(query);

    let paginateConfigCopy = { ...PaginateConfigRegistrationView };
    if (noLimit) {
      // These setting are needed to get all registrations
      // This is used for doing bulk updates with a filter
      paginateConfigCopy = { ...PaginateConfigRegistrationViewNoLimit };
      query.limit = 0;
    }

    const orignalSelect = query.select ? [...query.select] : [];
    const fullnameNamingConvention =
      await this.getFullNameNamingConvention(programId);

    if (query.select && query.select.includes('name')) {
      if (fullnameNamingConvention) {
        query.select = query.select.concat(fullnameNamingConvention);
      }
    }

    // If you want to select programFinancialServiceProviderConfigurationLabel, you also need to get financialServiceProvider because we need this to find the correct programFinancialServiceProviderConfigurationLabel
    if (
      query.select &&
      query.select.includes('programFinancialServiceProviderConfigurationLabel')
    ) {
      if (fullnameNamingConvention) {
        query.select.push('financialServiceProvider');
      }
    }

    if (!queryBuilder) {
      queryBuilder = this.registrationViewScopedRepository
        .createQueryBuilder('registration')
        .andWhere({ status: Not(RegistrationStatusEnum.deleted) });
    }
    queryBuilder = queryBuilder.andWhere(
      '"registration"."programId" = :programId',
      {
        programId,
      },
    );

    const programRegistrationAttributeRelations =
      await this.programService.getAllRelationProgram(programId);
    // Phonenumber is already in the registration table so we do not need to filter on it twice
    const relationsWithoutPhoneNumber =
      programRegistrationAttributeRelations.filter(
        (r) => r.name !== DefaultRegistrationDataAttributeNames.phoneNumber,
      );
    const relationNamesWithoutPhonenumber = relationsWithoutPhoneNumber.map(
      (r) => r.name,
    );

    // Check if the filter contains at least one registration data name
    if (query.filter) {
      const filters = Object.keys(query.filter);
      if (
        relationNamesWithoutPhonenumber.some((key) => filters.includes(key))
      ) {
        queryBuilder = this.filterOnRegistrationAttributeData(
          query,
          queryBuilder,
          relationsWithoutPhoneNumber,
        );
      }
    }

    if (query.search) {
      queryBuilder = this.addSearchToQueryBuilder(queryBuilder, query.search);
      delete query.search;
    }

    // Check if the sort contains at least one registration data name
    // At the moment we only support sorting on one field
    if (hasPersonalReadPermission && query.sortBy) {
      const [sortByKey, sortByValue] = query.sortBy[0];
      if (sortByValue !== 'ASC' && sortByValue !== 'DESC') {
        throw new HttpException(
          'sortByValue value is not ASC or DESC',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (relationNamesWithoutPhonenumber.some((key) => sortByKey === key)) {
        queryBuilder = this.sortOnRegistrationData(
          sortByKey,
          sortByValue,
          queryBuilder,
          programRegistrationAttributeRelations,
        );
      }
    }

    if (hasPersonalReadPermission) {
      paginateConfigCopy.relations = ['data'];
    } else {
      paginateConfigCopy.relations = [];
      paginateConfigCopy.searchableColumns = [];
    }

    // PaginateConfig.select and PaginateConfig.relations cannot be used in combi with each other
    // That's why we wrote some manual code to do the selection
    const result = await paginate<RegistrationViewEntity>(
      query,
      queryBuilder,
      paginateConfigCopy,
    );

    // Custom code is written here to filter on query.select since it does not work with query.relations
    let attributeRelationsSelect = [...programRegistrationAttributeRelations];
    const { select } = query;
    if (select !== undefined && select.length > 0) {
      attributeRelationsSelect = attributeRelationsSelect.filter((relation) =>
        select.includes(relation.name),
      );
    }

    const data = await this.mapPaginatedEntity({
      paginatedResult: result,
      attributeRelations: attributeRelationsSelect,
      select,
      orignalSelect,
      fullnameNamingConvention,
      hasPersonalReadPermission,
      programId,
    });

    return {
      ...result,
      data,
    };
  }

  public async getRegistrationsChunked(
    programId: number,
    paginateQuery: PaginateQuery,
    chunkSize: number,
    baseQuery?: ScopedQueryBuilder<RegistrationViewEntity>,
  ) {
    paginateQuery.limit = chunkSize;
    paginateQuery.page = 1;
    let totalPages = 1;

    let allRegistrations: Awaited<
      ReturnType<RegistrationsPaginationService['getPaginate']>
    >['data'] = [];

    for (let i = 0; i < totalPages; i++) {
      const paginateResult = await this.getPaginate(
        paginateQuery,
        programId,
        true,
        false,
        baseQuery ? baseQuery.clone() : undefined, // We need to create a seperate querybuilder object twice or it will be modified twice
      );
      totalPages = paginateResult.meta.totalPages;
      paginateQuery.page = paginateQuery.page + 1;
      allRegistrations = allRegistrations.concat(...paginateResult.data);
    }
    return allRegistrations;
  }

  // TODO: Move this function to registration view scoped repository
  public async getRegistrationViewsByReferenceIds({
    programId,
    referenceIds,
  }: {
    programId: number;
    referenceIds: string[];
  }): Promise<MappedPaginatedRegistrationDto[]> {
    let qb = this.registrationViewScopedRepository
      .createQueryBuilder('registration')
      .andWhere({ status: Not(RegistrationStatusEnum.deleted) });
    if (referenceIds.length > 0) {
      qb = qb.andWhere('registration.referenceId IN (:...referenceIds)', {
        referenceIds,
      });
    }
    return await this.getRegistrationsChunked(
      programId,
      { limit: 10000, path: '' },
      10000,
      qb,
    );
  }

  private addSearchToQueryBuilder(
    queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>,
    search: string,
  ): ScopedQueryBuilder<RegistrationViewEntity> {
    queryBuilder.leftJoin('registration.data', 'registrationDataSearch');
    queryBuilder.andWhere('registrationDataSearch.value ILIKE :search', {
      search: `%${search}%`,
    });
    return queryBuilder;
  }

  public async throwIfNoPersonalReadPermission(
    userId: number,
    programId: number,
    paginateQuery: PaginateQuery,
  ): Promise<void> {
    const hasPersonalRead = await this.userHasPermissionForProgram(
      userId,
      programId,
      PermissionEnum.RegistrationPersonalREAD,
    );
    if (!hasPersonalRead && paginateQuery.filter) {
      const registrationDataRelations =
        await this.programService.getAllRelationProgram(programId);
      const registrationDataNamesProgram = registrationDataRelations.map(
        (r) => r.name,
      );
      registrationDataNamesProgram.push(
        DefaultRegistrationDataAttributeNames.phoneNumber,
      );

      // Check if the filter contains at least one registration data name
      for (const registrationDataName of registrationDataNamesProgram) {
        if (Object.keys(paginateQuery.filter).includes(registrationDataName)) {
          throw new HttpException(
            `You do not have permission ${PermissionEnum.RegistrationPersonalREAD}. Not allowed to use filter paramter: ${registrationDataName}`,
            HttpStatus.FORBIDDEN,
          );
        }
      }
    }
  }

  public async userHasPermissionForProgram(
    userId: number,
    programId: number,
    permission: PermissionEnum,
  ): Promise<boolean> {
    const count = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.programAssignments', 'assignment')
      .leftJoin('assignment.program', 'program')
      .leftJoin('assignment.roles', 'roles')
      .leftJoin('roles.permissions', 'permissions')
      .where('user.id = :userId', { userId })
      .andWhere('program.id = :programId', { programId })
      .andWhere('permissions.name = :permissions', {
        permissions: permission,
      })
      .getCount();
    return count > 0;
  }

  private async getFullNameNamingConvention(
    programId: number,
  ): Promise<string[]> {
    const program = await this.programRepository.findOneOrFail({
      where: { id: Equal(programId) },
      select: ['fullnameNamingConvention'],
    });
    if (program.fullnameNamingConvention)
      return JSON.parse(JSON.stringify(program.fullnameNamingConvention));
    else {
      return [];
    }
  }

  private filterOnRegistrationAttributeData(
    query: PaginateQuery,
    queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>,
    attributeRelations: RegistrationDataInfo[],
  ): ScopedQueryBuilder<RegistrationViewEntity> {
    const filterObjects = this.createFilterObjects(attributeRelations);
    const parsedFilter = parseFilter(query, filterObjects);
    return this.filterRegistrationAttributeDataQb({
      queryBuilder,
      attributeRelations,
      parsedFilter,
    });
  }

  private createFilterObjects(
    attributeRelations: RegistrationDataInfo[],
  ): Record<string, FilterOperator[] | true> {
    const filterObject = {};
    for (const r of attributeRelations) {
      if (r.type === RegistrationAttributeTypes.numeric) {
        filterObject[r.name] = AllowedFilterOperatorsNumber;
      } else {
        filterObject[r.name] = AllowedFilterOperatorsString;
      }
    }
    return filterObject;
  }

  private filterRegistrationAttributeDataQb({
    queryBuilder,
    attributeRelations,
    parsedFilter,
  }: {
    queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>;
    attributeRelations: RegistrationDataInfo[];
    parsedFilter: ColumnsFilters;
  }): ScopedQueryBuilder<RegistrationViewEntity> {
    for (const [filterKey, filters] of Object.entries(parsedFilter)) {
      const relationInfoArray = attributeRelations.filter(
        (r) => r.name === filterKey,
      );
      const operatorTypes: FindOperatorType[] = [
        'equal',
        'in',
        'ilike',
        'isNull',
        'moreThan',
        'lessThan',
        'between',
      ];
      for (const filter of filters) {
        if (operatorTypes.includes(filter.findOperator.type)) {
          const uniqueJoinId = Array.from({ length: 25 }, () =>
            'abcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 26)),
          ).join('');
          queryBuilder.leftJoin('registration.data', uniqueJoinId);
          queryBuilder = this.applyFilterConditionAttributes({
            queryBuilder,
            filterType: filter.findOperator.type,
            value: filter.findOperator.value,
            uniqueJoinId,
          });
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

  private applyFilterConditionAttributes({
    queryBuilder,
    filterType,
    value,
    uniqueJoinId,
  }: {
    queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>;
    filterType: FindOperatorType;
    value: any;
    uniqueJoinId: string;
  }): ScopedQueryBuilder<RegistrationViewEntity> {
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
      case 'moreThan':
        return queryBuilder.andWhere(
          `${uniqueJoinId}.${columnName}::numeric > :value${uniqueJoinId}`,
          { [`value${uniqueJoinId}`]: value },
        );
      case 'lessThan':
        return queryBuilder.andWhere(
          `${uniqueJoinId}.${columnName}::numeric < :value${uniqueJoinId}`,
          { [`value${uniqueJoinId}`]: value },
        );
      case 'between':
        return queryBuilder.andWhere(
          `${uniqueJoinId}.${columnName}::numeric BETWEEN :value${uniqueJoinId}1 AND :value${uniqueJoinId}2`,
          {
            [`value${uniqueJoinId}1`]: value[0],
            [`value${uniqueJoinId}2`]: value[1],
          },
        );
      default:
        throw new HttpException(
          `Filter type ${filterType} is not supported`,
          HttpStatus.BAD_REQUEST,
        );
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
          qb.andWhere(`${uniqueJoinId}."${dataRelKey}" = ${id}`);
        } else {
          qb.orWhere(`${uniqueJoinId}."${dataRelKey}" = ${id}`);
        }
      }
      i++;
    }
  }

  private sortOnRegistrationData(
    sortByKey: string,
    sortByValue: 'ASC' | 'DESC',
    queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>,
    attributeRelations: RegistrationDataInfo[],
  ): ScopedQueryBuilder<RegistrationViewEntity> {
    const relationInfoArray = attributeRelations.filter(
      (r) => r.name === sortByKey,
    );
    queryBuilder.leftJoin('registration.data', 'rd');
    queryBuilder.andWhere(
      new Brackets((qb) => {
        this.whereRegistrationDataIsOneOfIds(relationInfoArray, qb, 'rd');
      }),
    );
    queryBuilder.orderBy('rd.value', sortByValue);
    queryBuilder.addSelect('rd.value');
    // This is somehow needed (without alias!) to make the orderBy work
    // These values are not returned because they are not mapped later on
    return queryBuilder;
  }

  private async mapPaginatedEntity({
    paginatedResult,
    attributeRelations,
    select,
    orignalSelect,
    fullnameNamingConvention,
    hasPersonalReadPermission,
  }: {
    paginatedResult: Paginated<RegistrationViewEntity>;
    attributeRelations: RegistrationDataInfo[];
    select?: string[];
    orignalSelect: string[];
    fullnameNamingConvention: string[];
    hasPersonalReadPermission: boolean;
    programId: number;
  }): Promise<MappedPaginatedRegistrationDto[]> {
    return paginatedResult.data.map((registration) => {
      const mappedRootRegistration = this.mapRootRegistration(
        registration,
        select,
        hasPersonalReadPermission,
      );

      const mappedRegistration = hasPersonalReadPermission
        ? this.mapRegistrationData(
            registration.data,
            mappedRootRegistration,
            attributeRelations,
          )
        : mappedRootRegistration;

      if ((!select || select.includes('name')) && hasPersonalReadPermission) {
        return this.mapRegistrationName({
          registration: mappedRegistration,
          select,
          orignalSelect,
          fullnameNamingConvention,
        });
      }

      return mappedRegistration;
    });
  }

  private mapRootRegistration(
    registration: RegistrationViewEntity,
    select?: string[],
    hasPersonalReadPermission?: boolean,
  ): Omit<RegistrationViewEntity, 'data'> {
    let mappedRegistration = omit(registration, 'data');

    if (select && select.length > 0) {
      mappedRegistration = new RegistrationViewEntity();
      for (const selectKey of select) {
        if (selectKey !== 'data' && registration[selectKey] !== undefined) {
          mappedRegistration[selectKey] = registration[selectKey];
        }
      }
    }

    if (!hasPersonalReadPermission) {
      delete mappedRegistration.phoneNumber;
    }

    return mappedRegistration;
  }

  private mapRegistrationData(
    registrationDataArray: RegistrationAttributeDataEntity[],
    mappedRegistration: ReturnType<
      RegistrationsPaginationService['mapRootRegistration']
    >,
    registrationDataInfoArray: RegistrationDataInfo[],
  ) {
    if (!registrationDataInfoArray || registrationDataInfoArray.length < 1) {
      return mappedRegistration;
    }

    const findRelation = (
      dataRelation: RegistrationDataRelation,
      data: RegistrationAttributeDataEntity,
    ): boolean => {
      const propertiesToCheck = ['programRegistrationAttributeId'];
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

    for (const dataRelation of registrationDataInfoArray) {
      const registrationData = registrationDataArray.find((x) =>
        findRelation(dataRelation.relation, x),
      );
      if (registrationData) {
        mappedRegistration[dataRelation.name] = registrationData.value;
      } else {
        mappedRegistration[dataRelation.name] = null;
      }
    }

    return mappedRegistration;
  }

  private mapRegistrationName<
    T extends ReturnType<RegistrationsPaginationService['mapRootRegistration']>,
  >({
    registration,
    select,
    orignalSelect,
    fullnameNamingConvention,
  }: {
    registration: T;
    select?: string[];
    orignalSelect: string[];
    fullnameNamingConvention: string[];
  }): T & { name: string } {
    const name = this.getName(registration, fullnameNamingConvention);
    if (select && select.includes('name')) {
      const differenceOrignalSelect = select.filter(
        (x) => !orignalSelect.includes(x),
      );
      for (const key of differenceOrignalSelect) {
        delete registration[key];
      }
    }
    return {
      ...registration,
      name,
    };
  }

  private getName(
    registrationRow: Partial<RegistrationViewEntity>,
    fullnameNamingConvention: string[],
  ): string {
    const fullnameConcat: string[] = [];
    const nameColumns = JSON.parse(JSON.stringify(fullnameNamingConvention));
    for (const nameColumn of nameColumns) {
      fullnameConcat.push(registrationRow[nameColumn]);
    }
    return fullnameConcat.join(' ');
  }

  public getQueryBuilderForFspInstructions({
    programId,
    payment,
    programFinancialServiceProviderConfigurationId,
    financialServiceProviderName,
    status,
  }: {
    programId: number;
    payment: number;
    programFinancialServiceProviderConfigurationId?: number;
    financialServiceProviderName?: FinancialServiceProviders;
    status?: TransactionStatusEnum;
  }): ScopedQueryBuilder<RegistrationViewEntity> {
    const query = this.registrationViewScopedRepository
      .createQueryBuilder('registration')
      .innerJoin('registration.latestTransactions', 'latestTransaction')
      .innerJoin('latestTransaction.transaction', 'transaction')
      .andWhere('registration.programId = :programId', { programId })
      .andWhere('transaction.payment = :payment', { payment })
      .orderBy('registration.referenceId', 'ASC');
    if (status) {
      query.andWhere('transaction.status = :status', { status });
    }
    if (programFinancialServiceProviderConfigurationId) {
      query.andWhere(
        'transaction.programFinancialServiceProviderConfigurationId = :programFinancialServiceProviderConfigurationId',
        { programFinancialServiceProviderConfigurationId },
      );
    }
    if (financialServiceProviderName) {
      query
        .leftJoin(
          'transaction.programFinancialServiceProviderConfiguration',
          'programFinancialServiceProviderConfiguration',
        )
        .andWhere(
          'programFinancialServiceProviderConfiguration.financialServiceProviderName = :financialServiceProviderName',
          { financialServiceProviderName },
        );
    }
    return query;
  }
}
