import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PaginateQuery } from 'nestjs-paginate';
import { Equal, In, Not } from 'typeorm';

import { ActionsService } from '@121-service/src/actions/actions.service';
import { FileDto } from '@121-service/src/metrics/dto/file.dto';
import { ProjectStats } from '@121-service/src/metrics/dto/project-stats.dto';
import { RegistrationStatusStats } from '@121-service/src/metrics/dto/registrationstatus-stats.dto';
import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { ExportVisaCardDetails } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/export-visa-card-details.interface';
import { ExportVisaCardDetailsRawData } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/export-visa-card-details-raw-data.interface';
import { IntersolveVisaStatusMapper } from '@121-service/src/payments/fsp-integration/intersolve-visa/mappers/intersolve-visa-status.mapper';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProjectRepository } from '@121-service/src/projects/repositories/project.repository';
import { ProjectRegistrationAttributeRepository } from '@121-service/src/projects/repositories/project-registration-attribute.repository';
import { PaginationFilter } from '@121-service/src/registration/dto/filter-attribute.dto';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationViewsMapper } from '@121-service/src/registration/mappers/registration-views.mapper';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserService } from '@121-service/src/user/user.service';
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
    private readonly projectRegistrationAttributeRepository: ProjectRegistrationAttributeRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly registrationScopedViewRepository: RegistrationViewScopedRepository,
    @Inject(getScopedRepositoryProviderName(TransactionEntity))
    private readonly transactionScopedRepository: ScopedRepository<TransactionEntity>,
    private readonly actionService: ActionsService,
    private readonly registrationsPaginationsService: RegistrationsPaginationService,
    private readonly intersolveVoucherService: IntersolveVoucherService,
    private readonly userService: UserService,
  ) {}

  public async getExportList({
    projectId,
    type,
    userId,
    paginationQuery,
  }: {
    projectId: number;
    userId: number;
    type: ExportType;
    paginationQuery?: PaginateQuery;
  }): Promise<FileDto> {
    await this.actionService.saveAction(userId, projectId, type);

    const permission =
      userPermissionMapByExportType[
        type as keyof typeof userPermissionMapByExportType
      ];

    const hasPermission = await this.userService.canActivate(
      permission,
      projectId,
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
        return this.getAllPeopleAffectedList({
          projectId,
          filter: paginationQuery.filter,
          search: paginationQuery.search,
          select: paginationQuery.select,
        });
      }
      case ExportType.unusedVouchers: {
        return this.getUnusedVouchers(projectId);
      }
      case ExportType.vouchersWithBalance: {
        return this.getVouchersWithBalance(projectId);
      }
      case ExportType.intersolveVisaCardDetails: {
        return this.createIntersolveVisaBalancesExport(projectId);
      }
      default:
        throw new HttpException(
          'Unknown ExportList type',
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  private async getAllPeopleAffectedList({
    projectId,
    filter,
    search,
    select,
  }: {
    projectId: number;
    filter?: PaginationFilter;
    search?: string;
    select?: string[];
  }): Promise<FileDto> {
    const data = await this.getRegistrationsList({
      projectId,
      exportType: ExportType.registrations,
      filter,
      search,
      select,
    });
    const response = {
      fileName: ExportType.registrations,
      data,
    };
    return response;
  }

  private async getRegistrationsList({
    projectId,
    exportType,
    filter,
    search,
    select,
  }: {
    projectId: number;
    exportType: ExportType;
    filter?: PaginationFilter;
    search?: string;
    select?: string[];
  }): Promise<object[]> {
    let rows: Record<string, unknown>[] =
      await this.getRegistrationsGenericFields({
        projectId,
        exportType,
        filter,
        search,
        select,
      });

    for await (const row of rows) {
      if (row['registrationProjectId']) {
        row['id'] = row['registrationProjectId'];
        delete row['registrationProjectId'];
      }

      if (typeof row['projectFspConfigurationLabel'] === 'object') {
        const preferredLanguage = 'en';
        row['projectFspConfigurationLabel'] = row[
          'projectFspConfigurationLabel'
        ]?.[preferredLanguage] as string | undefined;
      }
    }
    rows = await this.replaceValueWithDropdownLabel({
      rows,
      select,
      projectId,
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

  private async getUnusedVouchers(projectId?: number): Promise<FileDto> {
    const unusedVouchers =
      await this.intersolveVoucherService.getUnusedVouchers(projectId);

    const response = {
      fileName: ExportType.unusedVouchers,
      data: unusedVouchers,
    };

    return response;
  }

  private async getVouchersWithBalance(projectId: number): Promise<FileDto> {
    const vouchersWithBalance =
      await this.intersolveVoucherService.getVouchersWithBalance(projectId);
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
    projectId,
    exportType,
    filter,
    search,
    select,
  }: {
    projectId: number;
    exportType?: ExportType;
    filter?: PaginationFilter;
    search?: string;
    select?: string[];
  }): Promise<MappedPaginatedRegistrationDto[]> {
    // Create an empty scoped querybuilder object
    let queryBuilder = this.registrationScopedViewRepository
      .createQueryBuilder('registration')
      .andWhere({ projectId });

    if (exportType !== ExportType.registrations && !filter?.['status']) {
      queryBuilder = queryBuilder.andWhere(
        'registration."status" != :registrationStatus',
        {
          registrationStatus: RegistrationStatusEnum.deleted,
        },
      );
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
        projectId,
        paginateQuery,
        chunkSize,
        queryBuilder,
      );
    return data;
  }

  private async replaceValueWithDropdownLabel({
    projectId,
    rows,
    select,
  }: {
    projectId: number;
    rows: Record<string, unknown>[];
    select?: string[];
  }): Promise<Record<string, unknown>[]> {
    const dropdownAttributes =
      await this.projectRegistrationAttributeRepository.getDropdownAttributes({
        projectId,
        select,
      });

    // Converts values of dropdown questions to the labels of the list of registrations
    return RegistrationViewsMapper.replaceDropdownValuesWithEnglishLabel({
      rows,
      attributes: dropdownAttributes,
    });
  }

  public async getProjectStats(projectId: number): Promise<ProjectStats> {
    const project = await this.projectRepository.findOneByOrFail({
      id: projectId,
    });
    const targetedPeople = project.targetNrRegistrations;

    const includedPeople = await this.registrationScopedRepository.count({
      where: {
        project: { id: Equal(projectId) },
        registrationStatus: Equal(RegistrationStatusEnum.included),
      },
    });

    const newPeople = await this.registrationScopedRepository.count({
      where: {
        project: { id: Equal(projectId) },
        registrationStatus: Equal(RegistrationStatusEnum.new),
      },
    });

    const registeredPeople = await this.registrationScopedRepository.count({
      where: {
        project: { id: Equal(projectId) },
        registrationStatus: Not(
          In([RegistrationStatusEnum.declined, RegistrationStatusEnum.deleted]),
        ),
      },
    });

    const cashDisbursedQueryResult = await this.transactionScopedRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount::numeric)', 'cashDisbursed')
      .innerJoin('transaction.latestTransaction', 'lt')
      .leftJoin('transaction.payment', 'p')
      .andWhere({
        status: Not(TransactionStatusEnum.error),
      })
      .andWhere('p."projectId" = :projectId', { projectId })
      .getRawOne();
    const cashDisbursed = Number(cashDisbursedQueryResult.cashDisbursed);
    const totalBudget = project.budget;

    return {
      projectId,
      targetedPeople,
      includedPeople,
      newPeople,
      registeredPeople,
      totalBudget,
      cashDisbursed,
    };
  }

  private async createIntersolveVisaBalancesExport(projectId: number): Promise<{
    fileName: ExportType;
    data: ExportVisaCardDetails[];
  }> {
    const rawDebitCardDetails =
      await this.registrationScopedRepository.getDebitCardsDetailsForExport(
        projectId,
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
    let previousRegistrationProjectId: number | null = null;
    const exportCardDetailsArray: ExportVisaCardDetails[] = [];
    for (const cardRawData of exportVisaCardRawDetails) {
      const isCurrentWallet =
        previousRegistrationProjectId !== cardRawData.paId;

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
      previousRegistrationProjectId = cardRawData.paId;
    }
    return exportCardDetailsArray;
  }

  public async getRegistrationStatusStats(
    projectId: number,
  ): Promise<RegistrationStatusStats[]> {
    const query = this.registrationScopedRepository
      .createQueryBuilder('registration')
      .select(`registration."registrationStatus" AS status`)
      .addSelect(`COUNT(registration."registrationStatus") AS "statusCount"`)
      .andWhere({ projectId })
      .andWhere({ registrationStatus: Not(RegistrationStatusEnum.deleted) })
      .groupBy(`registration."registrationStatus"`);
    const res = await query.getRawMany<RegistrationStatusStats>();
    return res;
  }
}
