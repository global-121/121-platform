import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { uniq, without } from 'lodash';
import { PaginateQuery } from 'nestjs-paginate';
import { Equal, FindOperator, In, Not, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { ActionsService } from '@121-service/src/actions/actions.service';
import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FileDto } from '@121-service/src/metrics/dto/file.dto';
import { PaymentStateSumDto } from '@121-service/src/metrics/dto/payment-state-sum.dto';
import { ProgramStats } from '@121-service/src/metrics/dto/program-stats.dto';
import { RegistrationStatusStats } from '@121-service/src/metrics/dto/registrationstatus-stats.dto';
import { RowType } from '@121-service/src/metrics/dto/rolo-type.dto';
import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { ExportVisaCardDetails } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/export-visa-card-details.interface';
import { ExportVisaCardDetailsRawData } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/export-visa-card-details-raw-data.interface';
import { IntersolveVisaStatusMapper } from '@121-service/src/payments/fsp-integration/intersolve-visa/mappers/intersolve-visa-status.mapper';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import { PaginationFilter } from '@121-service/src/registration/dto/filter-attribute.dto';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import {
  RegistrationDataOptions,
  RegistrationDataRelation,
} from '@121-service/src/registration/dto/registration-data-relation.model';
import {
  DefaultRegistrationDataAttributeNames,
  GenericRegistrationAttributes,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationDataScopedRepository } from '@121-service/src/registration/modules/registration-data/repositories/registration-data.scoped.repository';
import { RegistrationsService } from '@121-service/src/registration/registrations.service';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { EntityClass } from '@121-service/src/shared/types/entity-class.type';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserService } from '@121-service/src/user/user.service';
import { RegistrationDataScopedQueryService } from '@121-service/src/utils/registration-data-query/registration-data-query.service';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
const MAX_NUMBER_OF_PAYMENTS_TO_EXPORT = 5;
const userPermissionMapByExportType = {
  [ExportType.allPeopleAffected]: [PermissionEnum.RegistrationPersonalEXPORT],
  [ExportType.included]: [PermissionEnum.RegistrationPersonalEXPORT],
  [ExportType.payment]: [PermissionEnum.RegistrationPaymentExport],
  [ExportType.unusedVouchers]: [PermissionEnum.PaymentVoucherExport],
  [ExportType.vouchersWithBalance]: [PermissionEnum.PaymentVoucherExport],
  [ExportType.duplicates]: [PermissionEnum.RegistrationPaymentExport],
  [ExportType.intersolveVisaCardDetails]: [PermissionEnum.FspDebitCardEXPORT],
};

@Injectable()
export class MetricsService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramRegistrationAttributeEntity)
  private readonly programRegistrationAttributeRepository: Repository<ProgramRegistrationAttributeEntity>;

  public constructor(
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly registrationScopedViewRepository: RegistrationViewScopedRepository,
    private readonly registrationDataScopedRepository: RegistrationDataScopedRepository,
    @Inject(getScopedRepositoryProviderName(TransactionEntity))
    private readonly transactionScopedRepository: ScopedRepository<TransactionEntity>,
    private readonly actionService: ActionsService,
    private readonly registrationsService: RegistrationsService,
    private readonly registrationsPaginationsService: RegistrationsPaginationService,
    private readonly registrationDataQueryService: RegistrationDataScopedQueryService,
    private readonly intersolveVoucherService: IntersolveVoucherService,
    private readonly userService: UserService,
  ) {}

  public async getExportList({
    programId,
    type,
    userId,
    paginationQuery,
    minPayment,
    maxPayment,
  }: {
    programId: number;
    userId: number;
    type: ExportType;
    minPayment: number | null;
    maxPayment: number | null;
    paginationQuery?: PaginateQuery;
  }): Promise<FileDto> {
    await this.actionService.saveAction(userId, programId, type);

    const permission =
      userPermissionMapByExportType[
        type as keyof typeof userPermissionMapByExportType
      ];

    const hasPermission = await this.userService.canActivate(
      permission,
      programId,
      userId,
    );
    if (!hasPermission) {
      throw new HttpException(
        "Forbidden! User doesn't have enough permission to export requested data.",
        HttpStatus.FORBIDDEN,
      );
    }

    switch (type) {
      case ExportType.allPeopleAffected: {
        if (!paginationQuery) {
          throw new HttpException(
            `paginationQuery is required for export type ${type}`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return this.getAllPeopleAffectedList(
          programId,
          paginationQuery.filter,
          paginationQuery.search,
        );
      }
      case ExportType.included: {
        return this.getInclusionList(programId);
      }
      case ExportType.payment: {
        if (!minPayment || !maxPayment) {
          throw new HttpException(
            `minPayment & maxPayment should be defined for export type ${type}`,
            HttpStatus.BAD_REQUEST,
          );
        }

        if (
          (maxPayment || 0) - (minPayment || 0) >
          MAX_NUMBER_OF_PAYMENTS_TO_EXPORT
        ) {
          throw new HttpException(
            `the difference between maxPayment & minPayment should limit to ${MAX_NUMBER_OF_PAYMENTS_TO_EXPORT}`,
            HttpStatus.BAD_REQUEST,
          );
        }

        return this.getPaymentDetails(programId, minPayment, maxPayment);
      }
      case ExportType.unusedVouchers: {
        return this.getUnusedVouchers(programId);
      }
      case ExportType.vouchersWithBalance: {
        return this.getVouchersWithBalance(programId);
      }
      case ExportType.duplicates: {
        return this.getDuplicates(programId);
      }
      case ExportType.intersolveVisaCardDetails: {
        return this.createIntersolveVisaBalancesExport(programId);
      }
      default:
        throw new HttpException(
          'Unknown ExportList type',
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  private async getAllPeopleAffectedList(
    programId: number,
    filter?: PaginationFilter,
    search?: string,
  ): Promise<FileDto> {
    const data = await this.getRegistrationsList(
      programId,
      ExportType.allPeopleAffected,
      undefined,
      filter,
      search,
    );
    const response = {
      fileName: ExportType.allPeopleAffected,
      data,
    };
    return response;
  }

  private async getInclusionList(programId: number): Promise<FileDto> {
    const data = await this.getRegistrationsList(
      programId,
      ExportType.included,
      RegistrationStatusEnum.included,
    );
    const response = {
      fileName: 'inclusion-list',
      data,
    };
    return response;
  }

  private async getPaymentDetails(
    programId: number,
    minPaymentId: number,
    maxPaymentId: number,
  ): Promise<FileDto> {
    const relationOptions = await this.getRelationOptionsForExport(
      programId,
      ExportType.included,
    );
    const pastPaymentDetails = await this.getPaymentDetailsPayment(
      programId,
      minPaymentId,
      maxPaymentId,
      relationOptions,
    );
    if (pastPaymentDetails.length === 0) {
      return {
        fileName: `details-included-people-affected-${minPaymentId}`,
        data: (await this.getInclusionList(programId)).data,
      };
    }
    const fileInput = {
      fileName: `details-completed-payment-${
        minPaymentId === maxPaymentId
          ? minPaymentId
          : `${minPaymentId}-to-${maxPaymentId}`
      }`,
      data: pastPaymentDetails,
    };

    return fileInput;
  }

  private async getRegistrationsList(
    programId: number,
    exportType: ExportType,
    registrationStatus?: RegistrationStatusEnum,
    filter?: PaginationFilter,
    search?: string,
  ): Promise<object[]> {
    if (registrationStatus) {
      filter = { status: registrationStatus };
    }
    const relationOptions = await this.getRelationOptionsForExport(
      programId,
      exportType,
    );
    const rows: RowType[] = (await this.getRegistrationsGenericFields(
      programId,
      relationOptions,
      exportType,
      filter,
      search,
    )) as RowType[];

    for await (const row of rows) {
      row['id'] = row['registrationProgramId'] ?? null;

      const preferredLanguage = 'en';
      row['programFinancialServiceProviderConfigurationLabel'] =
        typeof row['programFinancialServiceProviderConfigurationLabel'] ===
        'object'
          ? ((row['programFinancialServiceProviderConfigurationLabel']?.[
              preferredLanguage
            ] as string | undefined) ?? '')
          : (row['programFinancialServiceProviderConfigurationLabel'] ?? '');
      delete row['registrationProgramId'];
    }
    await this.replaceValueWithDropdownLabel(rows, relationOptions);

    const orderedObjects = rows.map((row) => {
      // An object which will serve as the order template
      const objectOrder = {
        referenceId: null,
        id: null,
        status: null,
        phoneNumber: null,
        preferredLanguage: null,
        financialserviceprovider: null,
        paymentAmountMultiplier: null,
        paymentCount: null,
      };
      return {
        ...objectOrder,
        ...row,
      };
    });

    return this.filterUnusedColumn(orderedObjects);
  }

  private async getRelationOptionsForExport(
    programId: number,
    exportType: ExportType,
  ): Promise<RegistrationDataOptions[]> {
    const relationOptions: RegistrationDataOptions[] = [];
    const program = await this.programRepository.findOneOrFail({
      where: { id: Equal(programId) },
      relations: ['programRegistrationAttributes'],
    });

    for (const programRegistrationAttribute of program.programRegistrationAttributes) {
      if (
        JSON.parse(
          JSON.stringify(programRegistrationAttribute.export),
        ).includes(exportType) &&
        programRegistrationAttribute.name !==
          DefaultRegistrationDataAttributeNames.phoneNumber // Phonenumber is exclude because it is already a registration entity attribute
      ) {
        const name = programRegistrationAttribute.name;
        const relation = {
          programRegistrationAttributeId: programRegistrationAttribute.id,
        };
        relationOptions.push({ name, relation });
      }
    }
    return relationOptions;
  }

  private getRelationOptionsForDuplicates(
    programRegistrationAttributes: ProgramRegistrationAttributeEntity[],
  ): RegistrationDataOptions[] {
    const relationOptions: RegistrationDataOptions[] = [];
    for (const programRegistrationAttribute of programRegistrationAttributes) {
      const name = programRegistrationAttribute.name;
      const relation = {
        programRegistrationAttributeId: programRegistrationAttribute.id,
      };
      relationOptions.push({ name, relation });
    }
    return relationOptions;
  }

  private async getUnusedVouchers(programId?: number): Promise<FileDto> {
    const unusedVouchers =
      await this.intersolveVoucherService.getUnusedVouchers(programId);

    const response = {
      fileName: ExportType.unusedVouchers,
      data: unusedVouchers,
    };

    return response;
  }

  private async getVouchersWithBalance(programId: number): Promise<FileDto> {
    const vouchersWithBalance =
      await this.intersolveVoucherService.getVouchersWithBalance(programId);
    const response = {
      fileName: ExportType.vouchersWithBalance,
      data: vouchersWithBalance,
    };
    return response;
  }

  public async getToCancelVouchers(): Promise<FileDto> {
    const toCancelVouchers =
      await this.intersolveVoucherService.getToCancelVouchers();

    const response = {
      fileName: ExportType.toCancelVouchers,
      data: toCancelVouchers,
    };

    return response;
  }

  private async getRegistrationsGenericFields(
    programId: number,
    relationOptions: RegistrationDataOptions[],
    exportType?: ExportType,
    filter?: PaginationFilter,
    search?: string,
  ): Promise<object[]> {
    // Create an empty scoped querybuilder object
    let queryBuilder = this.registrationScopedViewRepository
      .createQueryBuilder('registration')
      .andWhere({ programId });

    if (exportType !== ExportType.allPeopleAffected && !filter?.['status']) {
      queryBuilder = queryBuilder.andWhere(
        'registration."status" != :registrationStatus',
        {
          registrationStatus: RegistrationStatusEnum.deleted,
        },
      );
    }

    const defaultSelect = [
      GenericRegistrationAttributes.referenceId,
      GenericRegistrationAttributes.registrationProgramId,
      GenericRegistrationAttributes.status,
      GenericRegistrationAttributes.phoneNumber,
      GenericRegistrationAttributes.preferredLanguage,
      GenericRegistrationAttributes.paymentAmountMultiplier,
      GenericRegistrationAttributes.registrationCreatedDate,
      GenericRegistrationAttributes.programFinancialServiceProviderConfigurationLabel,
      GenericRegistrationAttributes.paymentCount,
    ] as string[];

    const program = await this.programRepository.findOneByOrFail({
      id: programId,
    });

    if (program.enableMaxPayments) {
      defaultSelect.push(GenericRegistrationAttributes.maxPayments);
    }

    if (program.enableScope) {
      defaultSelect.push(GenericRegistrationAttributes.scope);
    }

    const registrationDataNamesProgram = relationOptions
      .map((r) => r.name)
      .filter(
        (r): r is string =>
          r !== undefined &&
          r !== DefaultRegistrationDataAttributeNames.phoneNumber,
      );

    const chunkSize = 10000;
    const paginateQuery = {
      path: 'registration',
      filter,
      limit: chunkSize,
      page: 1,
      select: defaultSelect.concat(registrationDataNamesProgram),
      search,
    };

    const data =
      await this.registrationsPaginationsService.getRegistrationsChunked(
        programId,
        paginateQuery,
        chunkSize,
        queryBuilder,
      );
    return data;
  }

  private async getRegistrationsFieldsForDuplicates(
    programId: number,
    relationOptions: RegistrationDataOptions[],
    registrationIds: number[],
  ): Promise<MappedPaginatedRegistrationDto[]> {
    const query = this.registrationScopedRepository
      .createQueryBuilder('registration')
      .leftJoin(
        'registration.programFinancialServiceProviderConfiguration',
        'fspconfig',
      )
      .select([
        `registration."referenceId" AS "referenceId"`,
        `registration."registrationProgramId" AS "id"`,
        `registration."registrationStatus" AS status`,
        `fspconfig."financialServiceProviderName" AS "financialServiceProviderName"`,
        `fspconfig."label" AS "programFinancialServiceProviderLabel"`,
        'registration."scope" AS scope',
        `registration."${GenericRegistrationAttributes.phoneNumber}"`,
      ])
      .andWhere({ programId })
      .andWhere(
        'registration."registrationProgramId" IN (:...registrationIds)',
        {
          registrationIds,
        },
      )
      .orderBy('"registration"."registrationProgramId"', 'ASC');

    for (const r of relationOptions) {
      query.select((subQuery) => {
        return this.registrationDataQueryService.customDataEntrySubQuery(
          subQuery,
          r.relation,
        );
      }, r.name);
    }
    return await query.getRawMany();
  }

  private async replaceValueWithDropdownLabel(
    rows: Record<string, unknown>[],
    relationOptions: RegistrationDataOptions[],
  ): Promise<void> {
    // Creates mapping list of questions with a dropdown
    const valueOptionMappings: {
      questionName: string;
      options?: { option: string; label: Record<string, string> }[];
    }[] = [];

    for (const option of relationOptions) {
      if (option.relation?.programRegistrationAttributeId) {
        const dropdownProgramRegistrationAttribute =
          await this.programRegistrationAttributeRepository.findOne({
            where: {
              id: Equal(option.relation.programRegistrationAttributeId),
              type: Equal(RegistrationAttributeTypes.dropdown),
            },
          });
        if (dropdownProgramRegistrationAttribute) {
          valueOptionMappings.push({
            questionName: dropdownProgramRegistrationAttribute.name,
            options: dropdownProgramRegistrationAttribute.options ?? undefined,
          });
        }
      }
    }

    // Converts values of dropdown questions to the labels of the list of registrations
    for (const mapping of valueOptionMappings) {
      for (const r of rows) {
        const selectedOption = mapping.options?.find(
          (o) => o.option === r[mapping.questionName],
        );
        if (
          selectedOption &&
          selectedOption.label &&
          selectedOption.label['en']
        ) {
          r[mapping.questionName] = selectedOption.label['en'];
        }
      }
    }
  }

  private filterUnusedColumn(
    columnDetails: Record<string, unknown>[],
  ): Record<string, unknown>[] {
    return columnDetails.map((row) => {
      const filteredRow: Record<string, unknown> = {};

      for (const key in row) {
        if (row[key] != null) {
          filteredRow[key] = row[key];
        }
      }

      return filteredRow;
    });
  }

  private async getNameRelationsByProgram(
    programId: number,
  ): Promise<RegistrationDataOptions[]> {
    const program = await this.programRepository.findOneOrFail({
      relations: ['programRegistrationAttributes'],
      where: {
        id: Equal(programId),
      },
    });
    const relationOptions: RegistrationDataOptions[] = [];
    for (const entry of program.programRegistrationAttributes) {
      if (
        JSON.parse(JSON.stringify(program.fullnameNamingConvention)).includes(
          entry.name,
        )
      ) {
        const name = entry.name;
        const relation: RegistrationDataRelation = {
          programRegistrationAttributeId: entry.id,
        };

        relationOptions.push({ name, relation });
      }
    }
    return relationOptions;
  }

  private async getDuplicates(programId: number): Promise<{
    fileName: ExportType;
    data: unknown[];
  }> {
    const duplicatesMap = new Map<number, number[]>();
    const uniqueRegistrationIds = new Set<number>();

    const programRegistrationAttributes =
      await this.programRegistrationAttributeRepository.find({
        where: {
          program: {
            id: Equal(programId),
          },
          duplicateCheck: Equal(true),
        },
      });
    const programRegistrationAttributeIds = programRegistrationAttributes.map(
      (question) => {
        return question.id;
      },
    );

    const program = await this.programRepository.findOneOrFail({
      where: { id: Equal(programId) },
      relations: ['programFinancialServiceProviderConfigurations'],
    });

    const nameRelations = await this.getNameRelationsByProgram(programId);
    const duplicateRelationOptions = this.getRelationOptionsForDuplicates(
      programRegistrationAttributes,
    );
    const relationOptions = [...nameRelations, ...duplicateRelationOptions];

    const whereOptions: Record<string, FindOperator<unknown>>[] = [];
    if (programRegistrationAttributeIds.length > 0) {
      whereOptions.push({
        programRegistrationAttributeId: In(programRegistrationAttributeIds),
      });
    }

    const query = this.registrationDataScopedRepository
      .createQueryBuilder('registration_data')
      .select(
        `array_agg(DISTINCT registration_data."registrationId") AS "duplicateRegistrationIds"`,
      )
      .addSelect(
        `array_agg(DISTINCT registration."registrationProgramId") AS "duplicateRegistrationProgramIds"`,
      )
      .innerJoin('registration_data.registration', 'registration')
      .andWhere(whereOptions)
      .andWhere('registration.programId = :programId', { programId })
      .andWhere('registration."registrationStatus" != :status', {
        status: RegistrationStatusEnum.declined,
      })
      .andWhere('registration."registrationStatus" != :deletedStatus', {
        deletedStatus: RegistrationStatusEnum.deleted,
      })
      .having('COUNT(registration_data.value) > 1')
      .andHaving('COUNT(DISTINCT "registrationId") > 1')
      .groupBy('registration_data.value');

    const duplicates = await query.getRawMany();

    if (!duplicates || duplicates.length === 0) {
      return {
        fileName: ExportType.duplicates,
        data: [],
      };
    }

    for (const duplicateEntry of duplicates) {
      const {
        duplicateRegistrationProgramIds,
      }: {
        duplicateRegistrationIds: number[];
        duplicateRegistrationProgramIds: number[];
      } = duplicateEntry;
      for (const registrationId of duplicateRegistrationProgramIds) {
        uniqueRegistrationIds.add(registrationId);
        const others = without(duplicateRegistrationProgramIds, registrationId);
        const duplicateMapEntry = duplicatesMap.get(registrationId);
        if (duplicateMapEntry) {
          duplicatesMap.set(registrationId, duplicateMapEntry.concat(others));
        } else {
          duplicatesMap.set(registrationId, others);
        }
      }
    }

    // TODO: refactor this to use the paginate functionality
    return this.getRegisrationsForDuplicates(
      duplicatesMap,
      uniqueRegistrationIds,
      relationOptions,
      program,
    );
  }

  private async getRegisrationsForDuplicates(
    duplicatesMap: Map<number, number[]>,
    uniqueRegistrationProgramIds: Set<number>,
    relationOptions: RegistrationDataOptions[],
    program: ProgramEntity,
  ): Promise<{
    fileName: ExportType;
    data: unknown[];
  }> {
    const registrationAndFspId = await this.registrationScopedRepository.find({
      where: {
        registrationProgramId: In([
          ...Array.from(uniqueRegistrationProgramIds),
        ]),
        programId: Equal(program.id),
      },
      select: [
        'registrationProgramId',
        'programFinancialServiceProviderConfigurationId',
      ],
    });
    const registrationIds = registrationAndFspId.map((r) => {
      return {
        registrationProgramId: r.registrationProgramId,
        fspId: r.programFinancialServiceProviderConfigurationId,
      };
    });

    const allRegistrations: MappedPaginatedRegistrationDto[] =
      await this.getRegistrationsFieldsForDuplicates(
        program.id,
        relationOptions,
        registrationIds.map((r) => r.registrationProgramId),
      );

    const preferredLanguage = 'en';

    const result = allRegistrations.map(
      (registration: MappedPaginatedRegistrationDto) => {
        // Ensure registration is of type RegistrationType
        registration =
          this.registrationsService.transformRegistrationByNamingConvention(
            JSON.parse(JSON.stringify(program.fullnameNamingConvention)),
            registration,
          );

        // If a mapping exists, get the display name for the preferred language else use the FSP name
        registration['programFinancialServiceProviderLabel'] =
          registration['programFinancialServiceProviderLabel'][
            preferredLanguage
          ];

        return {
          ...registration,
          duplicateWithIds: uniq(duplicatesMap.get(registration['id'])).join(
            ',',
          ),
        };
      },
    );

    return {
      fileName: ExportType.duplicates,
      data: result,
    };
  }

  private async getPaymentDetailsPayment(
    programId: number,
    minPaymentId: number,
    maxPaymentId: number,
    registrationDataOptions: RegistrationDataOptions[],
  ): Promise<unknown[]> {
    const latestTransactionPerPa = await this.transactionScopedRepository
      .createQueryBuilder('transaction')
      .select('transaction.registrationId', 'registrationId')
      .addSelect('transaction.payment', 'payment')
      .addSelect('MAX(transaction.created)', 'maxCreated')
      .andWhere('transaction.program.id = :programId', {
        programId,
      })
      .andWhere('transaction.payment between :minPaymentId and :maxPaymentId', {
        minPaymentId,
        maxPaymentId,
      })
      .groupBy('transaction.registrationId')
      .addGroupBy('transaction.payment');

    // The SUBSTRING() in the query below is to prevent an error within the XLSX library when the string is too long (32767 characters)
    const transactionQuery = this.transactionScopedRepository
      .createQueryBuilder('transaction')
      .select([
        'registration.referenceId as "referenceId"',
        'registration.registrationProgramId as "id"',
        'transaction.status as "status"',
        'transaction.payment as "payment"',
        'transaction.created as "timestamp"',
        'registration.registrationStatus as "registrationStatus"',
        'registration.phoneNumber as "phoneNumber"',
        'registration.paymentAmountMultiplier as "paymentAmountMultiplier"',
        'transaction.amount as "amount"',
        'SUBSTRING(transaction."errorMessage", 1, 32000) as "errorMessage"',
        'fspConfig.name AS financialServiceProvider',
      ])
      .innerJoin(
        '(' + latestTransactionPerPa.getQuery() + ')',
        'subquery',
        'transaction.registrationId = subquery."registrationId" AND transaction.payment = subquery.payment AND transaction.created = subquery."maxCreated"',
      )
      .setParameters(latestTransactionPerPa.getParameters())
      .leftJoin('transaction.registration', 'registration')
      .leftJoin(
        'transaction.programFinancialServiceProviderConfiguration',
        'fspConfig',
      );

    const additionalFspExportFields =
      await this.getAdditionalFspExportFields(programId);

    for (const field of additionalFspExportFields) {
      transactionQuery.leftJoin(
        field.entityJoinedToTransaction,
        'joinTable',
        'transaction.id = joinTable.transactionId',
      );
      transactionQuery.addSelect(`"${field.attribute}"`);
    }

    const duplicateNames = registrationDataOptions
      .map((r) => r.name)
      .filter((value, index, self) => self.indexOf(value) !== index);

    const generatedUniqueIds: {
      originalName?: string;
      newUniqueName: string;
    }[] = [];
    for (const r of registrationDataOptions) {
      let name = r.name;
      if (duplicateNames.includes(r.name)) {
        const uniqueSelectQueryId = uuid().replace(/-/g, '').toLowerCase();
        name = `${uniqueSelectQueryId}_${r.name}`;
        generatedUniqueIds.push({ originalName: r.name, newUniqueName: name });
      }
      transactionQuery.select((subQuery) => {
        return this.registrationDataQueryService.customDataEntrySubQuery(
          subQuery,
          r.relation,
        );
      }, name);
    }
    const rawResult = await transactionQuery.getRawMany();
    return this.mapFspAttributesToOriginalName(rawResult, generatedUniqueIds);
  }

  private mapFspAttributesToOriginalName(
    rows: object[],
    generatedUniqueIdObjects: {
      newUniqueName: string;
      originalName?: string;
    }[],
  ): object[] {
    const generatedUniqueIds = generatedUniqueIdObjects.map(
      (o) => o.newUniqueName,
    );
    const result: object[] = [];

    for (const row of rows) {
      const resultRow: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(row)) {
        if (generatedUniqueIds.includes(key)) {
          const name = generatedUniqueIdObjects.find(
            (o) => o.newUniqueName === key,
          )?.originalName;
          if (!name) {
            throw new HttpException(
              'Error retrieving original name for FSP attribute',
              HttpStatus.BAD_REQUEST,
            );
          }
          if (value !== null) {
            resultRow[name] = value;
          }
        } else {
          resultRow[key] = value;
        }
      }
      result.push(resultRow);
    }

    return result;
  }

  private async getAdditionalFspExportFields(
    programId: number,
  ): Promise<
    { entityJoinedToTransaction: EntityClass<any>; attribute: string }[]
  > {
    const program = await this.programRepository.findOneOrFail({
      where: { id: Equal(programId) },
      relations: ['programFinancialServiceProviderConfigurations'],
    });
    let fields: {
      entityJoinedToTransaction: EntityClass<any>;
      attribute: string;
    }[] = [];

    for (const fspConfig of program.programFinancialServiceProviderConfigurations) {
      if (
        fspConfig.financialServiceProviderName ===
        FinancialServiceProviders.safaricom
      ) {
        fields = [
          ...fields,
          ...[
            {
              entityJoinedToTransaction: SafaricomTransferEntity,
              attribute: 'mpesaTransactionId',
            },
          ],
        ];
      }
    }
    return fields;
  }

  public async getPaymentsWithStateSums(
    programId: number,
  ): Promise<PaymentStateSumDto[]> {
    const totalProcessedPayments = await this.transactionScopedRepository
      .createQueryBuilder('transaction')
      .select('MAX(transaction.payment)')
      .andWhere('transaction."programId" = :programId', {
        programId,
      })
      .getRawOne();
    const program = await this.programRepository.findOneByOrFail({
      id: programId,
    });
    const paymentNrSearch = Math.max(
      totalProcessedPayments.max,
      program.distributionDuration ?? 0,
    );
    const paymentsWithStats: PaymentStateSumDto[] = [];
    let i = 1;
    const transactionStepMin = await await this.transactionScopedRepository
      .createQueryBuilder('transaction')
      .select('MIN(transaction.transactionStep)')
      .andWhere('transaction."programId" = :programId', {
        programId,
      })
      .getRawOne();
    while (i <= paymentNrSearch) {
      const result = await this.getOnePaymentWithStateSum(
        programId,
        i,
        transactionStepMin.min,
      );
      paymentsWithStats.push(result);
      i++;
    }
    return paymentsWithStats;
  }

  public async getOnePaymentWithStateSum(
    programId: number,
    payment: number,
    transactionStepOfInterest: number,
  ): Promise<PaymentStateSumDto> {
    const currentPaymentRegistrationsAndCount =
      await this.transactionScopedRepository.findAndCount({
        where: {
          program: { id: Equal(programId) },
          status: Equal(TransactionStatusEnum.success),
          payment: Equal(payment),
          transactionStep: Equal(transactionStepOfInterest),
        },
        relations: ['registration'],
      });
    const currentPaymentRegistrations = currentPaymentRegistrationsAndCount[0];
    const currentPaymentCount = currentPaymentRegistrationsAndCount[1];
    const currentPaymentRegistrationsIds = currentPaymentRegistrations.map(
      ({ registration }) => registration.id,
    );
    let preExistingPa: number;
    if (currentPaymentCount > 0) {
      preExistingPa = await this.transactionScopedRepository
        .createQueryBuilder('transaction')
        .leftJoin('transaction.registration', 'registration')
        .andWhere('transaction.registration.id IN (:...registrationIds)', {
          registrationIds: currentPaymentRegistrationsIds,
        })
        .andWhere('transaction.payment = :payment', {
          payment: payment - 1,
        })
        .andWhere('transaction.status = :status', {
          status: TransactionStatusEnum.success,
        })
        .andWhere('transaction.transactionStep = :transactionStep', {
          transactionStep: transactionStepOfInterest,
        })
        .andWhere('transaction.programId = :programId', {
          programId,
        })
        .getCount();
    } else {
      preExistingPa = 0;
    }
    return {
      id: payment,
      values: {
        'pre-existing': preExistingPa,
        new: currentPaymentCount - preExistingPa,
      },
    };
  }

  public async getProgramStats(programId: number): Promise<ProgramStats> {
    const program = await this.programRepository.findOneByOrFail({
      id: programId,
    });
    const targetedPeople = program.targetNrRegistrations;

    const includedPeople = await this.registrationScopedRepository.count({
      where: {
        program: { id: Equal(programId) },
        registrationStatus: Equal(RegistrationStatusEnum.included),
      },
    });

    const newPeople = await this.registrationScopedRepository.count({
      where: {
        program: { id: Equal(programId) },
        registrationStatus: Equal(RegistrationStatusEnum.registered),
      },
    });

    const registeredPeople = await this.registrationScopedRepository.count({
      where: {
        program: { id: Equal(programId) },
        registrationStatus: Not(
          In([RegistrationStatusEnum.declined, RegistrationStatusEnum.deleted]),
        ),
      },
    });

    const result = await this.transactionScopedRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'spentMoney')
      .innerJoin('transaction.latestTransaction', 'lt')
      .andWhere('transaction."programId" = :programId', {
        programId,
      })
      .getRawOne();
    const spentMoney = result.spentMoney;
    const totalBudget = program.budget;

    return {
      programId,
      targetedPeople,
      includedPeople,
      newPeople,
      registeredPeople,
      totalBudget,
      spentMoney,
    };
  }

  private async createIntersolveVisaBalancesExport(programId: number): Promise<{
    fileName: ExportType;
    data: ExportVisaCardDetails[];
  }> {
    const rawDebitCardDetails =
      await this.registrationScopedRepository.getDebitCardsDetailsForExport(
        programId,
      );

    const mappedDebitCardDetails =
      this.mapIntersolveVisaBalancesDataToDto(rawDebitCardDetails);

    return {
      fileName: ExportType.intersolveVisaCardDetails,
      data: mappedDebitCardDetails,
    };
  }

  private mapIntersolveVisaBalancesDataToDto(
    exportVisaCardRawDetails: ExportVisaCardDetailsRawData[],
  ): ExportVisaCardDetails[] {
    let previousRegistrationProgramId: number | null = null;
    const exportCardDetailsArray: ExportVisaCardDetails[] = [];
    for (const cardRawData of exportVisaCardRawDetails) {
      const isCurrentWallet =
        previousRegistrationProgramId !== cardRawData.paId;

      const statusInfo =
        IntersolveVisaStatusMapper.determineVisaCard121StatusInformation({
          isTokenBlocked: cardRawData.isTokenBlocked,
          walletStatus: cardRawData.walletStatus,
          cardStatus: cardRawData.cardStatus,
        });

      exportCardDetailsArray.push({
        paId: cardRawData.paId,
        referenceId: cardRawData.referenceId,
        registrationStatus: cardRawData.registrationStatus,
        cardNumber: cardRawData.cardNumber,
        cardStatus121: statusInfo.status,
        issuedDate: cardRawData.issuedDate,
        lastUsedDate: cardRawData.lastUsedDate,
        balance: cardRawData.balance / 100,
        explanation: statusInfo.explanation,
        spentThisMonth: cardRawData.spentThisMonth / 100,
        isCurrentWallet,
      });
      previousRegistrationProgramId = cardRawData.paId;
    }
    return exportCardDetailsArray;
  }

  public async getRegistrationStatusStats(
    programId: number,
  ): Promise<RegistrationStatusStats[]> {
    const query = this.registrationScopedRepository
      .createQueryBuilder('registration')
      .select(`registration."registrationStatus" AS status`)
      .addSelect(`COUNT(registration."registrationStatus") AS "statusCount"`)
      .andWhere({ programId })
      .andWhere({ registrationStatus: Not(RegistrationStatusEnum.deleted) })
      .groupBy(`registration."registrationStatus"`);
    const res = await query.getRawMany<RegistrationStatusStats>();
    return res;
  }
}
