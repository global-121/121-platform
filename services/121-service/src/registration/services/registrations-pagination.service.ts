import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramService } from '@121-service/src/programs/programs.service';
import {
  getFspDisplayNameMapping,
  overwriteFspDisplayName,
} from '@121-service/src/programs/utils/overwrite-fsp-display-name.helper';
import {
  AllowedFilterOperatorsString,
  PaginateConfigRegistrationView,
  PaginateConfigRegistrationViewNoLimit,
} from '@121-service/src/registration/const/filter-operation.const';
import {
  RegistrationDataInfo,
  RegistrationDataRelation,
} from '@121-service/src/registration/dto/registration-data-relation.model';
import { CustomDataAttributes } from '@121-service/src/registration/enum/custom-data-attributes';
import { PaymentFilterEnum } from '@121-service/src/registration/enum/payment-filter.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { ScopedQueryBuilder } from '@121-service/src/scoped.repository';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserEntity } from '@121-service/src/user/user.entity';
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
  ) {
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

    // If you want to select fspDisplayName, you also need to get financialServiceProvider because we need this to find the correct fspDisplayName
    if (query.select && query.select.includes('fspDisplayName')) {
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
        programId: programId,
      },
    );

    const registrationDataRelations =
      await this.programService.getAllRelationProgram(programId);
    const registrationDataNamesProgram = registrationDataRelations
      .map((r) => r.name)
      .filter((r) => r !== CustomDataAttributes.phoneNumber); // Phonenumber is already in the registration table so we do not need to filter on it twice

    // Check if the filter contains at least one registration data name
    if (query.filter) {
      const filters = Object.keys(query.filter);
      if (registrationDataNamesProgram.some((key) => filters.includes(key))) {
        queryBuilder = this.filterOnRegistrationData(
          query,
          queryBuilder,
          registrationDataRelations,
          registrationDataNamesProgram,
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
      if (registrationDataNamesProgram.some((key) => sortByKey === key)) {
        queryBuilder = this.sortOnRegistrationData(
          sortByKey,
          sortByValue,
          queryBuilder,
          registrationDataRelations,
        );
      }
    }

    if (hasPersonalReadPermission) {
      paginateConfigCopy.relations = ['data'];
    } else {
      paginateConfigCopy.searchableColumns = [];
    }

    queryBuilder = this.addPaymentFilter(queryBuilder, query);

    // PaginateConfig.select and PaginateConfig.relations cannot be used in combi with each other
    // That's why we wrote some manual code to do the selection
    const result = await paginate<RegistrationViewEntity>(
      query,
      queryBuilder,
      paginateConfigCopy,
    );

    // Custom code is written here to filter on query.select since it does not work with query.relations
    let registrationDataRelationsSelect = [...registrationDataRelations];
    const { select } = query;
    if (select !== undefined && select.length > 0) {
      registrationDataRelationsSelect = registrationDataRelationsSelect.filter(
        (relation) => select.includes(relation.name),
      );
    }

    const data = await this.mapPaginatedEntity({
      paginatedResult: result,
      registrationDataRelations: registrationDataRelationsSelect,
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
      const registrations = await this.getPaginate(
        paginateQuery,
        programId,
        true,
        false,
        baseQuery ? baseQuery.clone() : undefined, // We need to create a seperate querybuilder object twice or it will be modified twice
      );
      totalPages = registrations.meta.totalPages;
      paginateQuery.page = paginateQuery.page + 1;
      allRegistrations = allRegistrations.concat(...registrations.data);
    }
    return allRegistrations;
  }

  public async throwIfNoPermissionsForQuery(
    userId: number,
    programId: number,
    paginateQuery: PaginateQuery,
  ): Promise<void> {
    await this.throwIfNoTransactionReadPermission(
      userId,
      programId,
      paginateQuery,
    );
    await this.throwIfNoPersonalReadPermission(
      userId,
      programId,
      paginateQuery,
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

  private async throwIfNoTransactionReadPermission(
    userId: number,
    programId: number,
    paginateQuery: PaginateQuery,
  ): Promise<void> {
    const hasTransactionRead = await this.userHasPermissionForProgram(
      userId,
      programId,
      PermissionEnum.PaymentTransactionREAD,
    );
    if (!hasTransactionRead && paginateQuery.filter) {
      for (const filterKey of Object.keys(paginateQuery.filter)) {
        if (Object.values(PaymentFilterEnum).includes(filterKey as any)) {
          throw new HttpException(
            `You do not have permission ${
              PermissionEnum.PaymentTransactionREAD
            }. Not allowed to use filter parameters ${Object.values(
              PaymentFilterEnum,
            ).join(', ')}`,
            HttpStatus.FORBIDDEN,
          );
        }
      }
    }
  }

  private async throwIfNoPersonalReadPermission(
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
      registrationDataNamesProgram.push(CustomDataAttributes.phoneNumber);

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
      .where('user.id = :userId', { userId: userId })
      .andWhere('program.id = :programId', { programId: programId })
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

  public filterOnRegistrationData(
    query: PaginateQuery,
    queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>,
    registrationDataRelations: RegistrationDataInfo[],
    registrationDataNamesProgram: string[],
  ): ScopedQueryBuilder<RegistrationViewEntity> {
    const filterableColumnsRegData = this.createFilterObjects(
      registrationDataNamesProgram,
      AllowedFilterOperatorsString,
    );
    const parsedFilter = parseFilter(query, filterableColumnsRegData);
    return this.filterRegistrationDataQb(
      queryBuilder,
      registrationDataRelations,
      parsedFilter,
    );
  }

  private createFilterObjects(
    registrationDataNamesProgram: string[],
    allowedFilterOperators: FilterOperator[],
  ): Record<string, FilterOperator[] | true> {
    const filterObject = {};
    for (const name of registrationDataNamesProgram) {
      filterObject[name] = allowedFilterOperators;
    }
    return filterObject;
  }

  private filterRegistrationDataQb(
    queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>,
    registrationDataRelations: RegistrationDataInfo[],
    parsedFilter: ColumnsFilters,
  ): ScopedQueryBuilder<RegistrationViewEntity> {
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
    queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>,
    filterType: FindOperatorType,
    value: any,
    uniqueJoinId: string,
  ): ScopedQueryBuilder<RegistrationViewEntity> {
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
    registrationDataRelations: RegistrationDataInfo[],
  ): ScopedQueryBuilder<RegistrationViewEntity> {
    const relationInfoArray = registrationDataRelations.filter(
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
    registrationDataRelations,
    select,
    orignalSelect,
    fullnameNamingConvention,
    hasPersonalReadPermission,
    programId,
  }: {
    paginatedResult: Paginated<RegistrationViewEntity>;
    registrationDataRelations: RegistrationDataInfo[];
    select?: string[];
    orignalSelect: string[];
    fullnameNamingConvention: string[];
    hasPersonalReadPermission: boolean;
    programId: number;
  }) {
    const program = await this.programRepository.findOneOrFail({
      where: { id: Equal(programId) },
      relations: ['financialServiceProviders', 'programFspConfiguration'],
    });
    const fspDisplayNameMapping = getFspDisplayNameMapping(program);

    return paginatedResult.data.map((registration) => {
      const mappedRootRegistration = this.mapRootRegistration(
        registration,
        select,
        hasPersonalReadPermission,
      );
      // Add personal data permission check here
      let mappedRegistration = this.mapRegistrationData(
        registration.data,
        mappedRootRegistration,
        registrationDataRelations,
      );
      if (orignalSelect.includes('fspDisplayName')) {
        const overriddenFspDisplayName = overwriteFspDisplayName(
          mappedRegistration.financialServiceProvider,
          fspDisplayNameMapping,
        );
        if (overriddenFspDisplayName) {
          mappedRegistration.fspDisplayName = overriddenFspDisplayName;
        }
        if (!orignalSelect.includes('financialServiceProvider')) {
          delete mappedRegistration.financialServiceProvider;
        }
      }

      if ((!select || select.includes('name')) && hasPersonalReadPermission) {
        mappedRegistration = this.mapRegistrationName({
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
    registrationDataArray: RegistrationDataEntity[],
    mappedRegistration: ReturnType<
      RegistrationsPaginationService['mapRootRegistration']
    >,
    registrationDataInfoArray: RegistrationDataInfo[],
  ) {
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

  private mapRegistrationName({
    registration,
    select,
    orignalSelect,
    fullnameNamingConvention,
  }: {
    registration: ReturnType<
      RegistrationsPaginationService['mapRootRegistration']
    >;
    select?: string[];
    orignalSelect: string[];
    fullnameNamingConvention: string[];
  }) {
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
      name: this.getName(registration, fullnameNamingConvention),
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

  private addPaymentFilter(
    queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>,
    paginateQuery: PaginateQuery,
  ): ScopedQueryBuilder<RegistrationViewEntity> {
    const filterableColumns = this.createFilterObjects(
      Object.values(PaymentFilterEnum),
      [FilterOperator.EQ],
    );

    const parsedFilter = parseFilter(paginateQuery, filterableColumns);
    const filterOptions = [
      {
        key: PaymentFilterEnum.successPayment,
        alias: 'latestTransactionsSuccess',
        status: StatusEnum.success,
      },
      {
        key: PaymentFilterEnum.failedPayment,
        alias: 'latestTransactionsFailed',
        status: StatusEnum.error,
      },
      {
        key: PaymentFilterEnum.waitingPayment,
        alias: 'latestTransactionsWaiting',
        status: StatusEnum.waiting,
      },
      {
        key: PaymentFilterEnum.notYetSentPayment,
        alias: 'latestTransactionsNull',
        status: null,
      },
    ];

    for (const option of filterOptions) {
      if (
        paginateQuery.filter &&
        Object.keys(parsedFilter).includes(option.key)
      ) {
        for (const filter of parsedFilter[option.key]) {
          const paymentNumber = filter.findOperator.value;
          // if payment number is numeric, add the filter
          if (!isNaN(Number(paymentNumber))) {
            queryBuilder = this.addPaymentFilterJoin({
              queryBuilder,
              alias: option.alias,
              status: option.status,
              paymentNumber,
            });
          }
        }
      }
    }
    return queryBuilder;
  }

  private addPaymentFilterJoin({
    queryBuilder,
    alias,
    status,
    paymentNumber,
  }: {
    queryBuilder: ScopedQueryBuilder<RegistrationViewEntity>;
    alias: string;
    status: StatusEnum | null;
    paymentNumber: string;
  }): ScopedQueryBuilder<RegistrationViewEntity> {
    const paymentNumberKey = `${alias}PaymentNumber`;
    const statusKey = `${alias}Status`;
    queryBuilder.leftJoin(
      'registration.latestTransactions',
      alias,
      `"${alias}"."payment" = :${paymentNumberKey}`,
      { [paymentNumberKey]: paymentNumber },
    );
    if (status) {
      queryBuilder
        .innerJoin(`${alias}.transaction`, `transaction${alias}`)
        .andWhere(`"transaction${alias}"."status" = :${statusKey}`, {
          [statusKey]: status,
        });
    } else {
      queryBuilder.andWhere(`"${alias}"."id" IS NULL`);
    }
    return queryBuilder;
  }

  public getQueryBuilderForFsp(
    programId: number,
    payment: number,
    fspName: FinancialServiceProviderName,
    status?: StatusEnum,
  ): ScopedQueryBuilder<RegistrationViewEntity> {
    const query = this.registrationViewScopedRepository
      .createQueryBuilder('registration')
      .innerJoin('registration.latestTransactions', 'latestTransaction')
      .innerJoin('latestTransaction.transaction', 'transaction')
      .innerJoin('transaction.financialServiceProvider', 'fsp')
      .andWhere('registration.programId = :programId', { programId })
      .andWhere('transaction.payment = :payment', { payment })
      .andWhere('fsp.fsp = :fsp', {
        fsp: fspName,
      })
      .orderBy('registration.referenceId', 'ASC');
    if (status) {
      query.andWhere('transaction.status = :status', { status });
    }
    return query;
  }
}
