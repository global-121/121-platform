import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateQuery } from 'nestjs-paginate';
import { Equal, In, Not, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { ActionsService } from '@121-service/src/actions/actions.service';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FileDto } from '@121-service/src/metrics/dto/file.dto';
import { ProgramStats } from '@121-service/src/metrics/dto/program-stats.dto';
import { RegistrationStatusStats } from '@121-service/src/metrics/dto/registrationstatus-stats.dto';
import { RowType } from '@121-service/src/metrics/dto/rolo-type.dto';
import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { ExportVisaCardDetails } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/export-visa-card-details.interface';
import { ExportVisaCardDetailsRawData } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/export-visa-card-details-raw-data.interface';
import { IntersolveVisaStatusMapper } from '@121-service/src/payments/fsp-integration/intersolve-visa/mappers/intersolve-visa-status.mapper';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { NedbankVoucherEntity } from '@121-service/src/payments/fsp-integration/nedbank/entities/nedbank-voucher.entity';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import { PaginationFilter } from '@121-service/src/registration/dto/filter-attribute.dto';
import { RegistrationDataOptions } from '@121-service/src/registration/dto/registration-data-relation.model';
import {
  DefaultRegistrationDataAttributeNames,
  GenericRegistrationAttributes,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { createRegistrationAttributeSubQuery } from '@121-service/src/registration/helpers/create-registration-attribute-sub-query.helper';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { EntityClass } from '@121-service/src/shared/types/entity-class.type';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserService } from '@121-service/src/user/user.service';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
const MAX_NUMBER_OF_PAYMENTS_TO_EXPORT = 5;
const userPermissionMapByExportType = {
  [ExportType.allRegistrations]: [PermissionEnum.RegistrationPersonalEXPORT],
  [ExportType.included]: [PermissionEnum.RegistrationPersonalEXPORT],
  [ExportType.payment]: [PermissionEnum.RegistrationPaymentExport],
  [ExportType.unusedVouchers]: [PermissionEnum.PaymentVoucherExport],
  [ExportType.vouchersWithBalance]: [PermissionEnum.PaymentVoucherExport],
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
    @Inject(getScopedRepositoryProviderName(TransactionEntity))
    private readonly transactionScopedRepository: ScopedRepository<TransactionEntity>,
    private readonly actionService: ActionsService,
    private readonly registrationsPaginationsService: RegistrationsPaginationService,
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
      case ExportType.allRegistrations: {
        if (!paginationQuery) {
          throw new HttpException(
            `paginationQuery is required for export type ${type}`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return this.getAllPeopleAffectedList({
          programId,
          filter: paginationQuery.filter,
          search: paginationQuery.search,
          select: paginationQuery.select,
        });
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

  private async getAllPeopleAffectedList({
    programId,
    filter,
    search,
    select,
  }: {
    programId: number;
    filter?: PaginationFilter;
    search?: string;
    select?: string[];
  }): Promise<FileDto> {
    const data = await this.getRegistrationsList({
      programId,
      exportType: ExportType.allRegistrations,
      filter,
      search,
      select,
    });
    const response = {
      fileName: ExportType.allRegistrations,
      data,
    };
    return response;
  }

  private async getInclusionList(programId: number): Promise<FileDto> {
    const data = await this.getRegistrationsList({
      programId,
      exportType: ExportType.included,
      filter: { status: RegistrationStatusEnum.included },
    });
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

  private async getRegistrationsList({
    programId,
    exportType,
    filter,
    search,
    select,
  }: {
    programId: number;
    exportType: ExportType;
    filter?: PaginationFilter;
    search?: string;
    select?: string[];
  }): Promise<object[]> {
    const relationOptions = await this.getRelationOptionsForExport(
      programId,
      exportType,
    );
    const rows: RowType[] = (await this.getRegistrationsGenericFields({
      programId,
      relationOptions,
      exportType,
      filter,
      search,
      select,
    })) as RowType[];

    for await (const row of rows) {
      row['id'] = row['registrationProgramId'] ?? null;
      delete row['registrationProgramId'];

      if (typeof row['programFspConfigurationLabel'] === 'object') {
        const preferredLanguage = 'en';
        row['programFspConfigurationLabel'] = row[
          'programFspConfigurationLabel'
        ]?.[preferredLanguage] as string | undefined;
      }
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
        fsp: null,
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

  private async getRegistrationsGenericFields({
    programId,
    relationOptions,
    exportType,
    filter,
    search,
    select,
  }: {
    programId: number;
    relationOptions: RegistrationDataOptions[];
    exportType?: ExportType;
    filter?: PaginationFilter;
    search?: string;
    select?: string[];
  }): Promise<object[]> {
    // Create an empty scoped querybuilder object
    let queryBuilder = this.registrationScopedViewRepository
      .createQueryBuilder('registration')
      .andWhere({ programId });

    if (exportType !== ExportType.allRegistrations && !filter?.['status']) {
      queryBuilder = queryBuilder.andWhere(
        'registration."status" != :registrationStatus',
        {
          registrationStatus: RegistrationStatusEnum.deleted,
        },
      );
    }

    if (!select) {
      select = await this.getDefaultSelectForExportRegistrations({
        programId,
        relationOptions,
      });
    }

    const chunkSize = 10000;
    const paginateQuery = {
      path: 'registration',
      filter,
      limit: chunkSize,
      page: 1,
      select,
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

  private async getDefaultSelectForExportRegistrations({
    programId,
    relationOptions,
  }: {
    programId: number;
    relationOptions: RegistrationDataOptions[];
  }): Promise<string[]> {
    const defaultSelect = [
      GenericRegistrationAttributes.referenceId,
      GenericRegistrationAttributes.registrationProgramId,
      GenericRegistrationAttributes.status,
      GenericRegistrationAttributes.phoneNumber,
      GenericRegistrationAttributes.preferredLanguage,
      GenericRegistrationAttributes.paymentAmountMultiplier,
      GenericRegistrationAttributes.programFspConfigurationLabel,
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

    return defaultSelect.concat(registrationDataNamesProgram);
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

  private async getPaymentDetailsPayment(
    programId: number,
    minPaymentId: number,
    maxPaymentId: number,
    registrationDataOptions: RegistrationDataOptions[],
  ): Promise<unknown[]> {
    // TODO: This should use the latestTransactionEntity instead of the custom query here to decide what is the lastest transaction
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
        'registration.id as "registrationId"',
        'transaction.status as "status"',
        'transaction.payment as "payment"',
        'transaction.created as "created"',
        'transaction.updated as "updated"',
        'registration.registrationStatus as "registrationStatus"',
        'registration.phoneNumber as "phoneNumber"',
        'registration.paymentAmountMultiplier as "paymentAmountMultiplier"',
        'transaction.amount as "amount"',
        'SUBSTRING(transaction."errorMessage", 1, 32000) as "errorMessage"',
        'fspConfig.name AS fsp',
      ])
      .innerJoin(
        '(' + latestTransactionPerPa.getQuery() + ')',
        'subquery',
        'transaction.registrationId = subquery."registrationId" AND transaction.payment = subquery.payment AND transaction.created = subquery."maxCreated"',
      )
      .setParameters(latestTransactionPerPa.getParameters())
      .leftJoin('transaction.registration', 'registration')
      .leftJoin('transaction.programFspConfiguration', 'fspConfig');

    const additionalFspExportFields =
      await this.getAdditionalFspExportFields(programId);

    for (const field of additionalFspExportFields) {
      const joinTableAlias = `joinTable${field.entityJoinedToTransaction.name}${field.attribute}`;
      transactionQuery.leftJoin(
        field.entityJoinedToTransaction,
        joinTableAlias,
        `transaction.id = ${joinTableAlias}.transactionId`,
      );
      transactionQuery.addSelect(
        `"${joinTableAlias}"."${field.attribute}" as "${field.alias}"`,
      );
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
        return createRegistrationAttributeSubQuery(subQuery, r.relation);
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

  private async getAdditionalFspExportFields(programId: number): Promise<
    {
      entityJoinedToTransaction: EntityClass<any>;
      attribute: string;
      alias: string;
    }[]
  > {
    const program = await this.programRepository.findOneOrFail({
      where: { id: Equal(programId) },
      relations: ['programFspConfigurations'],
    });
    let fields: {
      entityJoinedToTransaction: EntityClass<any>;
      attribute: string;
      alias: string;
    }[] = [];

    for (const fspConfig of program.programFspConfigurations) {
      if (fspConfig.fspName === Fsps.safaricom) {
        fields = [
          ...fields,
          ...[
            {
              entityJoinedToTransaction: SafaricomTransferEntity,
              attribute: 'mpesaTransactionId',
              alias: 'mpesaTransactionId',
            },
          ],
        ];
      }
      if (fspConfig.fspName === Fsps.nedbank) {
        fields = [
          ...fields,
          ...[
            {
              entityJoinedToTransaction: NedbankVoucherEntity, //TODO: should we move this to fsps-settings.const.ts?
              attribute: 'status',
              alias: 'nedbankVoucherStatus',
            },
            {
              entityJoinedToTransaction: NedbankVoucherEntity, //TODO: should we move this to fsps-settings.const.ts?
              attribute: 'orderCreateReference',
              alias: 'nedbankOrderCreateReference',
            },
            {
              entityJoinedToTransaction: NedbankVoucherEntity, //TODO: should we move this to fsps-settings.const.ts?
              attribute: 'paymentReference',
              alias: 'nedbankPaymentReference',
            },
          ],
        ];
      }
    }
    return fields;
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
