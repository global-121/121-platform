import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { parseFilter } from 'nestjs-paginate/lib/filter';
import { Equal, Repository } from 'typeorm';

import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramService } from '@121-service/src/programs/programs.service';
import {
  AllowedFiltersNumber,
  AllowedFiltersString,
  PaginateConfigRegistrationView,
  PaginateConfigRegistrationViewNoLimit,
} from '@121-service/src/registration/const/filter-operation.const';
import { FindAllRegistrationsResultDto } from '@121-service/src/registration/dto/find-all-registrations-result.dto';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { RegistrationDataInfo } from '@121-service/src/registration/dto/registration-data-relation.model';
import {
  DefaultRegistrationDataAttributeNames,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationViewsMapper } from '@121-service/src/registration/mappers/registration-views.mapper';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { ScopedQueryBuilder } from '@121-service/src/scoped.repository';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserEntity } from '@121-service/src/user/user.entity';

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

    // If you want to select programFspConfigurationLabel, you also need to get fsp because we need this to find the correct programFspConfigurationLabel
    if (query.select && query.select.includes('programFspConfigurationLabel')) {
      if (fullnameNamingConvention) {
        query.select.push('fsp');
      }
    }

    if (!queryBuilder) {
      queryBuilder =
        this.registrationViewScopedRepository.createQueryBuilderExcludeDeleted();
    }
    queryBuilder = this.registrationViewScopedRepository.addProgramFilter({
      queryBuilder,
      programId,
    });

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
      queryBuilder =
        this.registrationViewScopedRepository.addSearchToQueryBuilder(
          queryBuilder,
          query.search,
        );
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
        queryBuilder =
          this.registrationViewScopedRepository.sortOnRegistrationData(
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

  public async getRegistrationViewsByReferenceIds({
    programId,
    referenceIds,
  }: {
    programId: number;
    referenceIds: string[];
  }): Promise<MappedPaginatedRegistrationDto[]> {
    const qb =
      this.registrationViewScopedRepository.createQueryBuilderToGetRegistrationViewsByReferenceIds(
        referenceIds,
      );
    return await this.getRegistrationsChunked(
      programId,
      { limit: 10000, path: '' },
      10000,
      qb,
    );
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

  // TODO: Put this function in a user module
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
    return this.registrationViewScopedRepository.filterRegistrationAttributeDataQb(
      {
        queryBuilder,
        attributeRelations,
        parsedFilter,
      },
    );
  }

  private createFilterObjects(
    attributeRelations: RegistrationDataInfo[],
  ): Record<string, FilterOperator[] | true> {
    const filterObject = {};
    for (const r of attributeRelations) {
      if (r.type === RegistrationAttributeTypes.numeric) {
        filterObject[r.name] = [...AllowedFiltersNumber];
      } else {
        filterObject[r.name] = [...AllowedFiltersString];
      }
    }
    return filterObject;
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
      const mappedRootRegistration =
        RegistrationViewsMapper.selectRegistrationRootFields({
          registration,
          select,
          hasPersonalReadPermission,
        });

      const mappedRegistration = hasPersonalReadPermission
        ? RegistrationViewsMapper.mapAttributeDataToRegistration(
            registration.data,
            mappedRootRegistration,
            attributeRelations,
          )
        : mappedRootRegistration;

      if ((!select || select.includes('name')) && hasPersonalReadPermission) {
        return RegistrationViewsMapper.appendNameUsingNamingConvention({
          registration: mappedRegistration,
          select,
          orignalSelect,
          fullnameNamingConvention,
        });
      }

      return mappedRegistration;
    });
  }
}
