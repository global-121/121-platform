import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PaginateQuery } from 'nestjs-paginate';
import { Equal, In, Not } from 'typeorm';

import { ActionsService } from '@121-service/src/actions/actions.service';
import { FileDto } from '@121-service/src/metrics/dto/file.dto';
import {
  AggregatePerMonth,
  AggregatePerPayment,
} from '@121-service/src/metrics/dto/payment-aggregate.dto';
import { ProgramStats } from '@121-service/src/metrics/dto/program-stats.dto';
import { RegistrationCountByDate } from '@121-service/src/metrics/dto/registration-count-by-date.dto';
import { RegistrationStatusStats } from '@121-service/src/metrics/dto/registrationstatus-stats.dto';
import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { ExportVisaCardDetails } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/export-visa-card-details.interface';
import { ExportVisaCardDetailsRawData } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/export-visa-card-details-raw-data.interface';
import { IntersolveVisaStatusMapper } from '@121-service/src/payments/fsp-integration/intersolve-visa/mappers/intersolve-visa-status.mapper';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher.service';
import { PaymentsReportingService } from '@121-service/src/payments/services/payments-reporting.service';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationViewsMapper } from '@121-service/src/registration/mappers/registration-views.mapper';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserService } from '@121-service/src/user/user.service';
import { dateSort } from '@121-service/src/utils/dateSort';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

const userPermissionMapByExportType = {
  [ExportType.registrations]: [PermissionEnum.RegistrationPersonalEXPORT],
  [ExportType.unusedVouchers]: [PermissionEnum.PaymentVoucherExport],
  [ExportType.vouchersWithBalance]: [PermissionEnum.PaymentVoucherExport],
  [ExportType.intersolveVisaCardDetails]: [PermissionEnum.FspDebitCardEXPORT],
};

@Injectable()
export class MetricsService {
  public constructor(
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly programRegistrationAttributeRepository: ProgramRegistrationAttributeRepository,
    private readonly programRepository: ProgramRepository,
    private readonly registrationScopedViewRepository: RegistrationViewScopedRepository,
    @Inject(getScopedRepositoryProviderName(TransactionEntity))
    private readonly transactionScopedRepository: ScopedRepository<TransactionEntity>,
    private readonly actionService: ActionsService,
    private readonly registrationsPaginationsService: RegistrationsPaginationService,
    private readonly intersolveVoucherService: IntersolveVoucherService,
    private readonly userService: UserService,
    private readonly paymentsReportingService: PaymentsReportingService,
  ) {}

  public async getExport({
    programId,
    type,
    userId,
    paginationQuery,
  }: {
    programId: number;
    userId: number;
    type: ExportType;
    paginationQuery?: PaginateQuery;
  }): Promise<FileDto> {
    const validExportType = [
      ExportType.registrations,
      ExportType.unusedVouchers,
      ExportType.vouchersWithBalance,
      ExportType.intersolveVisaCardDetails,
    ];
    if (type === undefined || !validExportType.includes(type)) {
      throw new HttpException(
        `Invalid export type: ${type}. Valid types are: ${validExportType.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
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
      case ExportType.registrations: {
        if (!paginationQuery) {
          throw new HttpException(
            `paginationQuery is required for export type ${type}`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return this.getRegistrationsExport({
          programId,
          paginationQuery,
        });
      }
      case ExportType.unusedVouchers: {
        return this.getUnusedVouchersExport(programId);
      }
      case ExportType.vouchersWithBalance: {
        return this.getVouchersWithBalanceExport(programId);
      }
      case ExportType.intersolveVisaCardDetails: {
        return this.getIntersolveVisaBalancesExport(programId);
      }
      default:
        throw new Error(`Unsupported export type: ${type}`);
    }
  }

  private async getRegistrationsExport({
    programId,
    paginationQuery,
  }: {
    programId: number;
    paginationQuery: PaginateQuery;
  }): Promise<FileDto> {
    const data = await this.getRegistrationsData({
      programId,
      paginationQuery,
    });
    const response = {
      fileName: ExportType.registrations,
      data,
    };
    return response;
  }

  private async getRegistrationsData({
    programId,
    paginationQuery,
  }: {
    programId: number;
    paginationQuery: PaginateQuery;
  }): Promise<object[]> {
    let rows: Record<string, unknown>[] =
      await this.getRegistrationsGenericFields({
        programId,
        paginationQuery,
      });

    for await (const row of rows) {
      if (row['registrationProgramId']) {
        row['id'] = row['registrationProgramId'];
        delete row['registrationProgramId'];
      }

      if (typeof row['programFspConfigurationLabel'] === 'object') {
        const preferredLanguage = 'en';
        row['programFspConfigurationLabel'] = row[
          'programFspConfigurationLabel'
        ]?.[preferredLanguage] as string | undefined;
      }
    }
    rows = await this.replaceValueWithDropdownLabel({
      rows,
      select: paginationQuery.select,
      programId,
    });

    const orderedObjects = rows.map((row) => {
      // Enforce this order of keys if present
      const keyOrder = [
        'referenceId',
        'id',
        'status',
        'phoneNumber',
        'preferredLanguage',
        'fsp',
        'paymentAmountMultiplier',
        'paymentCount',
      ];
      return this.orderObjectKeys(row, keyOrder);
    });
    return orderedObjects;
  }

  private async getRegistrationsGenericFields({
    programId,
    paginationQuery,
  }: {
    programId: number;
    paginationQuery: PaginateQuery;
  }): Promise<MappedPaginatedRegistrationDto[]> {
    // Create an empty scoped queryBuilder object
    const queryBuilder = this.registrationScopedViewRepository
      .createQueryBuilder('registration')
      .andWhere({ programId });

    const chunkSize = 10000;
    const paginateQueryForBulk = {
      path: 'registration',
      filter: paginationQuery.filter,
      limit: chunkSize,
      page: 1,
      select: paginationQuery.select,
      search: paginationQuery.search,
    };

    const data =
      await this.registrationsPaginationsService.getRegistrationViewsChunkedByPaginateQuery(
        programId,
        paginateQueryForBulk,
        chunkSize,
        queryBuilder,
      );
    return data;
  }

  private orderObjectKeys<T extends Record<string, unknown>>(
    obj: T,
    desiredOrder: string[],
  ): Record<string, unknown> {
    const ordered: Record<string, unknown> = {};

    for (const key of desiredOrder) {
      if (key in obj) {
        ordered[key] = obj[key];
      }
    }

    for (const key in obj) {
      if (!desiredOrder.includes(key)) {
        ordered[key] = obj[key];
      }
    }

    return ordered;
  }

  private async getUnusedVouchersExport(programId?: number): Promise<FileDto> {
    const unusedVouchers =
      await this.intersolveVoucherService.getUnusedVouchers(programId);

    const response = {
      fileName: ExportType.unusedVouchers,
      data: unusedVouchers,
    };

    return response;
  }

  private async getVouchersWithBalanceExport(
    programId: number,
  ): Promise<FileDto> {
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

  private async replaceValueWithDropdownLabel({
    programId,
    rows,
    select,
  }: {
    programId: number;
    rows: Record<string, unknown>[];
    select?: string[];
  }): Promise<Record<string, unknown>[]> {
    const dropdownAttributes =
      await this.programRegistrationAttributeRepository.getDropdownAttributes({
        programId,
        select,
      });

    // Converts values of dropdown questions to the labels of the list of registrations
    return RegistrationViewsMapper.replaceDropdownValuesWithEnglishLabel({
      rows,
      attributes: dropdownAttributes,
    });
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
        registrationStatus: Equal(RegistrationStatusEnum.new),
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

    const cashDisbursedQueryResult = await this.transactionScopedRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction."transferValue"::numeric)', 'cashDisbursed')
      .leftJoin('transaction.payment', 'p')
      .andWhere({
        status: Not(TransactionStatusEnum.error),
      })
      .andWhere('p."programId" = :programId', { programId })
      .getRawOne();
    const cashDisbursed = Number(cashDisbursedQueryResult.cashDisbursed);
    const totalBudget = program.budget;

    return {
      programId,
      targetedPeople,
      includedPeople,
      newPeople,
      registeredPeople,
      totalBudget,
      cashDisbursed,
    };
  }

  private async getIntersolveVisaBalancesExport(programId: number): Promise<{
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

  public async getRegistrationCountByDate({
    programId,
    startDate,
  }: {
    programId: number;
    startDate?: Date;
  }): Promise<RegistrationCountByDate> {
    const query = this.registrationScopedRepository
      .createQueryBuilder('registration')
      .select(`to_char(registration.created, 'yyyy-mm-dd') as "created"`)
      .addSelect(`COUNT(*)`)
      .andWhere({ programId })
      .groupBy(`to_char(registration.created, 'yyyy-mm-dd')`)
      .orderBy(`to_char(registration.created, 'yyyy-mm-dd')`);

    if (startDate) {
      query.andWhere('registration.created >= :startDate', { startDate });
    }
    const res = (await query.getRawMany()).reduce(
      (dates: Record<string, number>, r) => {
        dates[r.created] = Number(r.count);
        return dates;
      },
      {},
    );
    return res;
  }

  public async getAllPaymentsAggregates({
    programId,
    limitNumberOfPayments,
  }: {
    programId: number;
    limitNumberOfPayments?: number;
  }): Promise<AggregatePerPayment[]> {
    const allPaymentsAggregates: AggregatePerPayment[] = [];

    const payments = await this.paymentsReportingService.getPayments({
      programId,
      limitNumberOfPayments,
    });

    const paymentsSorted = dateSort(payments, (payment) => payment.paymentDate);

    for (const payment of paymentsSorted) {
      const aggregate = {
        id: payment.paymentId,
        date: payment.paymentDate,
        aggregatedStatuses:
          await this.paymentsReportingService.getPaymentAggregation(
            programId,
            payment.paymentId,
          ),
      };
      allPaymentsAggregates.push(aggregate);
    }
    return allPaymentsAggregates;
  }

  public async getAmountSentByMonth({
    programId,
    limitNumberOfPayments,
  }: {
    programId: number;
    limitNumberOfPayments?: number;
  }): Promise<AggregatePerMonth> {
    const res: AggregatePerMonth = {};

    const payments = await this.paymentsReportingService.getPayments({
      programId,
      limitNumberOfPayments,
    });

    for (const payment of payments) {
      const month = new Date(payment.paymentDate)
        .toISOString()
        .split('T')[0]
        .slice(0, -3);

      if (!res[month]) {
        res[month] = {
          success: 0,
          waiting: 0,
          failed: 0,
        };
      }

      const aggregate =
        await this.paymentsReportingService.getPaymentAggregation(
          programId,
          payment.paymentId,
        );

      res[month].success += Number(aggregate.success.transferValue);
      res[month].waiting += Number(aggregate.waiting.transferValue);
      res[month].failed += Number(aggregate.failed.transferValue);
    }
    return res;
  }
}
