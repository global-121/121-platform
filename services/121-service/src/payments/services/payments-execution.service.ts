import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateQuery } from 'nestjs-paginate';
import { Equal, Repository } from 'typeorm';

import { AdditionalActionType } from '@121-service/src/actions/action.entity';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { getFspConfigurationRequiredProperties } from '@121-service/src/fsps/fsp-settings.helpers';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { PaPaymentRetryDataDto } from '@121-service/src/payments/dto/pa-payment-retry-data.dto';
import { SplitPaymentListDto } from '@121-service/src/payments/dto/split-payment-lists.dto';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { AirtelService } from '@121-service/src/payments/fsp-integration/airtel/services/airtel.service';
import { CommercialBankEthiopiaService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/services/commercial-bank-ethiopia.service';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { FspIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/services/intersolve-visa.service';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher.service';
import { NedbankService } from '@121-service/src/payments/fsp-integration/nedbank/services/nedbank.service';
import { OnafriqService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.service';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { PaymentEventsService } from '@121-service/src/payments/payment-events/payment-events.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { TransactionJobsCreationService } from '@121-service/src/payments/services/transaction-jobs-creation.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProjectFspConfigurationRepository } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.repository';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import {
  BulkActionResultPaymentDto,
  BulkActionResultRetryPaymentDto,
} from '@121-service/src/registration/dto/bulk-action-result.dto';
import { ReferenceIdsDto } from '@121-service/src/registration/dto/reference-ids.dto';
import { DefaultRegistrationDataAttributeNames } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/registration-attribute-data.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { ScopedQueryBuilder } from '@121-service/src/scoped.repository';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { splitArrayIntoChunks } from '@121-service/src/utils/chunk.helper';

@Injectable()
export class PaymentsExecutionService {
  @InjectRepository(ProjectEntity)
  private readonly projectRepository: Repository<ProjectEntity>;

  @InjectRepository(PaymentEntity)
  private readonly paymentRepository: Repository<PaymentEntity>;

  private fspNameToServiceMap: Record<
    Fsps,
    [FspIntegrationInterface, useWhatsapp?: boolean]
  >;

  public constructor(
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly actionService: ActionsService,
    private readonly azureLogService: AzureLogService,
    private readonly transactionsService: TransactionsService,
    private readonly intersolveVoucherService: IntersolveVoucherService,
    // TODO: REFACTOR: This should be refactored after the other FSPs (all except Intersolve Visa) are also refactored.
    private readonly intersolveVisaService: IntersolveVisaService,
    private readonly safaricomService: SafaricomService,
    private readonly airtelService: AirtelService,
    private readonly commercialBankEthiopiaService: CommercialBankEthiopiaService,
    private readonly excelService: ExcelService,
    private readonly nedbankService: NedbankService,
    private readonly onafriqService: OnafriqService,
    private readonly registrationsBulkService: RegistrationsBulkService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly projectFspConfigurationRepository: ProjectFspConfigurationRepository,
    private readonly paymentEventsService: PaymentEventsService,
    private readonly transactionJobsCreationService: TransactionJobsCreationService,
    private readonly paymentsProgressHelperService: PaymentsProgressHelperService,
  ) {
    this.fspNameToServiceMap = {
      [Fsps.intersolveVoucherWhatsapp]: [this.intersolveVoucherService, true],
      [Fsps.intersolveVoucherPaper]: [this.intersolveVoucherService, false],
      // TODO: REFACTOR: This should be refactored after the other FSPs (all except Intersolve Visa) are also refactored.
      [Fsps.intersolveVisa]: [this.intersolveVisaService],
      [Fsps.safaricom]: [this.safaricomService],
      [Fsps.commercialBankEthiopia]: [this.commercialBankEthiopiaService],
      [Fsps.excel]: [this.excelService],
      [Fsps.deprecatedJumbo]: [{} as FspIntegrationInterface],
      [Fsps.nedbank]: [this.nedbankService],
      [Fsps.onafriq]: [this.onafriqService],
      [Fsps.airtel]: [this.airtelService],
    };
  }

  public async createPayment({
    userId,
    projectId,
    amount,
    query,
    dryRun,
    note,
  }: {
    userId: number;
    projectId: number;
    amount: number | undefined;
    query: PaginateQuery;
    dryRun: boolean;
    note?: string;
  }): Promise<BulkActionResultPaymentDto> {
    if (!dryRun) {
      await this.paymentsProgressHelperService.checkPaymentInProgressAndThrow(
        projectId,
      );
    }

    // TODO: REFACTOR: Move what happens in setQueryPropertiesBulkAction into this function, and call a refactored version of getBulkActionResult/getPaymentBaseQuery (create solution design first)
    const paginateQuery =
      this.registrationsBulkService.setQueryPropertiesBulkAction({
        query,
        includePaymentAttributes: true,
      });

    // Fill bulkActionResultDto with meta data of the payment being done
    const bulkActionResultDto =
      await this.registrationsBulkService.getBulkActionResult(
        paginateQuery,
        projectId,
        this.getPaymentBaseQuery(), // We need to create a seperate querybuilder object twice or it will be modified twice
      );

    // If amount is not defined do not calculate the totalMultiplierSum
    // This happens when you call the endpoint with dryRun=true
    // Calling with dryrun is true happens in the pa table when you try to do a payment to decide which registrations are selectable
    if (!amount) {
      return {
        ...bulkActionResultDto,
        sumPaymentAmountMultiplier: 0,
        projectFspConfigurationNames: [],
      };
    }

    // Get array of RegistrationViewEntity objects to be paid
    const registrationsForPayment =
      await this.getRegistrationsForPaymentChunked(projectId, paginateQuery);

    // Calculate the totalMultiplierSum and create an array with all FSPs for this payment
    // Get the sum of the paymentAmountMultiplier of all registrations to calculate the total amount of money to be paid in frontend
    let totalMultiplierSum = 0;
    // This loop is pretty fast: with 131k registrations it takes ~38ms

    for (const registration of registrationsForPayment) {
      totalMultiplierSum =
        totalMultiplierSum + registration.paymentAmountMultiplier;
      // This is only needed in actual doPayment call
    }

    // Get unique projectFspConfigurationNames in payment
    // Getting unique projectFspConfigurationNames is relatively: with 131k registrations it takes ~36ms locally
    const projectFspConfigurationNames = Array.from(
      new Set(
        registrationsForPayment.map(
          (registration) => registration.projectFspConfigurationName,
        ),
      ),
    );

    // Fill bulkActionResultPaymentDto with bulkActionResultDto and additional payment specific data
    const bulkActionResultPaymentDto: BulkActionResultPaymentDto = {
      ...bulkActionResultDto,
      sumPaymentAmountMultiplier: totalMultiplierSum,
      projectFspConfigurationNames,
    };

    // Create an array of referenceIds to be paid
    const referenceIds = registrationsForPayment.map(
      (registration) => registration.referenceId,
    );

    if (!dryRun && referenceIds.length > 0) {
      await this.checkFspConfigurationsOrThrow(
        projectId,
        projectFspConfigurationNames,
      );
      const paymentId = await this.createPaymentAndEventsEntities({
        userId,
        projectId,
        note,
      });
      bulkActionResultPaymentDto.id = paymentId;
      // TODO: REFACTOR: userId not be passed down, but should be available in a context object; registrationsForPayment.length is redundant, as it is the same as referenceIds.length
      void this.initiatePayment({
        userId,
        projectId,
        paymentId,
        amount,
        referenceIds,
        bulkSize: referenceIds.length,
      })
        .catch((e) => {
          this.azureLogService.logError(e, true);
        })
        .finally(() => {
          void this.actionService.saveAction(
            userId,
            projectId,
            AdditionalActionType.paymentFinished,
          );
        });
    }

    return bulkActionResultPaymentDto;
  }

  private async createPaymentAndEventsEntities({
    userId,
    projectId,
    note,
  }: {
    userId: number;
    projectId: number;
    note?: string;
  }): Promise<number> {
    const paymentEntity = new PaymentEntity();
    paymentEntity.projectId = projectId;
    const savedPaymentEntity = await this.paymentRepository.save(paymentEntity);

    await this.paymentEventsService.createCreatedEvent({
      paymentId: savedPaymentEntity.id,
      userId,
    });

    if (note) {
      await this.paymentEventsService.createNoteEvent({
        paymentId: savedPaymentEntity.id,
        userId,
        note,
      });
    }

    return savedPaymentEntity.id;
  }

  private async checkFspConfigurationsOrThrow(
    projectId: number,
    projectFspConfigurationNames: string[],
  ): Promise<void> {
    const validationResults = await Promise.all(
      projectFspConfigurationNames.map((name) =>
        this.validateMissingFspConfigurations(projectId, name),
      ),
    );
    const errorMessages = validationResults.flat();
    if (errorMessages.length > 0) {
      throw new HttpException(
        `${errorMessages.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async validateMissingFspConfigurations(
    projectId: number,
    projectFspConfigurationName: string,
  ): Promise<string[]> {
    const config = await this.projectFspConfigurationRepository.findOne({
      where: {
        name: Equal(projectFspConfigurationName),
        projectId: Equal(projectId),
      },
      relations: ['properties'],
    });

    const errorMessages: string[] = [];
    if (!config) {
      errorMessages.push(
        `Missing Project FSP configuration with name ${projectFspConfigurationName}`,
      );
      return errorMessages;
    }

    const requiredConfigurations = getFspConfigurationRequiredProperties(
      config.fspName,
    );
    // Early return for FSP that don't have required configurations
    if (!requiredConfigurations) {
      return [];
    }

    for (const requiredConfiguration of requiredConfigurations) {
      const foundConfig = config.properties.find(
        (c) => c.name === requiredConfiguration,
      );
      if (!foundConfig) {
        errorMessages.push(
          `Missing required configuration ${requiredConfiguration} for FSP ${config.fspName}`,
        );
      }
    }

    return errorMessages;
  }

  private async getRegistrationsForPaymentChunked(
    projectId: number,
    paginateQuery: PaginateQuery,
  ) {
    const chunkSize = 4000;

    return await this.registrationsPaginationService.getRegistrationsChunked(
      projectId,
      paginateQuery,
      chunkSize,
      this.getPaymentBaseQuery(),
    );
  }

  private getPaymentBaseQuery(): ScopedQueryBuilder<RegistrationViewEntity> {
    return this.registrationsBulkService
      .getBaseQuery()
      .andWhere('registration.status = :status', {
        status: RegistrationStatusEnum.included,
      });
  }

  public async initiatePayment({
    userId,
    projectId,
    paymentId,
    amount,
    referenceIds,
    bulkSize,
  }: {
    userId: number;
    projectId: number;
    paymentId: number;
    amount: number;
    referenceIds: string[];
    bulkSize: number;
  }): Promise<number> {
    await this.actionService.saveAction(
      userId,
      projectId,
      AdditionalActionType.paymentStarted,
    );

    // Split the referenceIds into chunks of 1000, to prevent heap out of memory errors
    const BATCH_SIZE = 1000;
    const paymentChunks = splitArrayIntoChunks(referenceIds, BATCH_SIZE);

    let paymentTransactionResult = 0;
    for (const chunk of paymentChunks) {
      // Get the registration data for the payment (like phone number, bankaccountNumber etc)
      const paPaymentDataList = await this.getPaymentList(
        chunk,
        amount,
        projectId,
        userId,
        bulkSize,
      );

      const result = await this.payout({
        paPaymentDataList,
        projectId,
        paymentId,
        isRetry: false,
      });

      paymentTransactionResult += result;
    }
    return paymentTransactionResult;
  }

  public async retryPayment(
    userId: number,
    projectId: number,
    paymentId: number,
    referenceIdsDto?: ReferenceIdsDto,
  ): Promise<BulkActionResultRetryPaymentDto> {
    await this.paymentsProgressHelperService.checkPaymentInProgressAndThrow(
      projectId,
    );

    await this.getProjectWithFspConfigOrThrow(projectId);

    const paPaymentDataList = await this.getPaymentListForRetry(
      projectId,
      paymentId,
      userId,
      referenceIdsDto?.referenceIds,
    );

    if (paPaymentDataList.length < 1) {
      const errors = 'There are no targeted PAs for this payment';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    await this.actionService.saveAction(
      userId,
      projectId,
      AdditionalActionType.paymentStarted,
    );

    void this.payout({
      paPaymentDataList,
      projectId,
      paymentId,
      isRetry: true,
    })
      .catch((e) => {
        this.azureLogService.logError(e, true);
      })
      .finally(() => {
        void this.actionService.saveAction(
          userId,
          projectId,
          AdditionalActionType.paymentFinished,
        );
      });

    const projectFspConfigurationNames: string[] = [];
    // This loop is pretty fast: with 131k registrations it takes ~38ms
    for (const registration of paPaymentDataList) {
      if (
        !projectFspConfigurationNames.includes(
          registration.projectFspConfigurationName,
        )
      ) {
        projectFspConfigurationNames.push(
          registration.projectFspConfigurationName,
        );
      }
    }

    return {
      totalFilterCount: paPaymentDataList.length,
      applicableCount: paPaymentDataList.length,
      nonApplicableCount: 0,
      projectFspConfigurationNames,
    };
  }

  private async getProjectWithFspConfigOrThrow(
    projectId: number,
  ): Promise<ProjectEntity> {
    const project = await this.projectRepository.findOne({
      where: { id: Equal(projectId) },
      relations: ['projectFspConfigurations'],
    });
    if (!project) {
      const errors = 'Project not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return project;
  }

  public async payout({
    paPaymentDataList,
    projectId,
    paymentId,
    isRetry = false,
  }: {
    paPaymentDataList: PaPaymentDataDto[];
    projectId: number;
    paymentId: number;
    isRetry?: boolean;
  }): Promise<number> {
    // Create an object with an array of PA data for each FSP
    const paLists = this.splitPaListByFsp(paPaymentDataList);

    await this.initiatePaymentPerFsp({
      paLists,
      projectId,
      paymentId,
      isRetry,
    });

    return paPaymentDataList.length;
  }

  private splitPaListByFsp(
    paPaymentDataList: PaPaymentDataDto[],
  ): SplitPaymentListDto {
    return paPaymentDataList.reduce(
      (acc: SplitPaymentListDto, paPaymentData) => {
        if (!acc[paPaymentData.fspName]) {
          acc[paPaymentData.fspName] = [];
        }
        acc[paPaymentData.fspName]!.push(paPaymentData);
        return acc;
      },
      {},
    );
  }

  private async initiatePaymentPerFsp({
    paLists,
    projectId,
    paymentId,
    isRetry,
  }: {
    paLists: SplitPaymentListDto;
    projectId: number;
    paymentId: number;
    isRetry: boolean;
  }): Promise<void> {
    const fspsThatUseTransactionJobsCreationService = [
      Fsps.intersolveVisa,
      Fsps.safaricom,
      Fsps.airtel,
      Fsps.nedbank,
      Fsps.onafriq,
    ];

    await Promise.all(
      Object.entries(paLists).map(async ([fsp, paPaymentList]) => {
        /*
            TODO: REFACTOR: We need to refactor the Payments Service during segregation of duties implementation, so that the Payments Service calls a private function per FSP with a list of ReferenceIds (or RegistrationIds ?!)
            which then gathers the necessary data to create transaction jobs for the FSP.

            Until then, we do a temporary hack here for Intersolve Visa, mapping paPaymentList to only a list of referenceIds. The only thing is we do not know here if this is a retry.
            See this.createIntersolveVisaTransferJobs() of how this is handled.
          */

        if (fspsThatUseTransactionJobsCreationService.includes(fsp as Fsps)) {
          return await this.transactionJobsCreationService.createAndAddFspSpecificTransactionJobs(
            {
              fspName: fsp,
              referenceIdsAndTransactionAmounts: paPaymentList.map(
                (paPaymentData) => {
                  return {
                    referenceId: paPaymentData.referenceId,
                    transactionAmount: paPaymentData.transactionAmount,
                  };
                },
              ),
              userId: paPaymentList[0].userId,
              projectId,
              paymentId,
              isRetry,
            },
          );
        }

        const [paymentService, useWhatsapp] = this.fspNameToServiceMap[fsp];
        return await paymentService.sendPayment(
          paPaymentList,
          projectId,
          paymentId,
          useWhatsapp,
        );
      }),
    );
  }

  // TODO: This function should be defined in a repository, however it will be changed when implementing segregation of duties, so let's leave the refactor until than
  private failedTransactionForRegistrationAndPayment(
    q: ScopedQueryBuilder<RegistrationEntity>,
    paymentId: number,
  ): ScopedQueryBuilder<RegistrationEntity> {
    q.leftJoin(
      (qb) =>
        qb
          .from(TransactionEntity, 'transactions')
          .select('MAX("created")', 'created')
          .addSelect('"paymentId"', 'paymentId')
          .andWhere('"paymentId" = :paymentId', { paymentId })
          .groupBy('"paymentId"')
          .addSelect('"transactionStep"', 'transactionStep')
          .addGroupBy('"transactionStep"')
          .addSelect('"registrationId"', 'registrationId')
          .addGroupBy('"registrationId"'),
      'transaction_max_created',
      `transaction_max_created."registrationId" = registration.id`,
    )
      .leftJoin(
        'registration.transactions',
        'transaction',
        `transaction."registrationId" = transaction_max_created."registrationId"
      AND transaction."paymentId" = transaction_max_created."paymentId"
      AND transaction."transactionStep" = transaction_max_created."transactionStep"
      AND transaction."created" = transaction_max_created."created"
      AND transaction.status = '${TransactionStatusEnum.error}'`,
      )
      .addSelect([
        'transaction.amount AS "transactionAmount"',
        'transaction.id AS "transactionId"',
      ]);
    return q;
  }
  // TODO: This function should be defined in a repository, however it will be changed when implementing segregation of duties, so let's leave the refactor until than
  private getPaymentRegistrationsQuery(
    projectId: number,
  ): ScopedQueryBuilder<RegistrationEntity> {
    const q = this.registrationScopedRepository
      .createQueryBuilder('registration')
      .select('"referenceId"')
      .addSelect('registration.id as id')
      .addSelect('"fspConfig"."fspName" as "fspName"')
      .addSelect('"fspConfig"."id" as "projectFspConfigurationId"')
      .andWhere('registration."projectId" = :projectId', { projectId })
      .leftJoin('registration.projectFspConfiguration', 'fspConfig');
    q.addSelect((subQuery) => {
      return subQuery
        .addSelect('value', 'paymentAddress')
        .from(RegistrationAttributeDataEntity, 'data')
        .leftJoin('data.projectRegistrationAttribute', 'attribute')
        .andWhere('attribute.name IN (:...names)', {
          names: [
            DefaultRegistrationDataAttributeNames.phoneNumber,
            DefaultRegistrationDataAttributeNames.whatsappPhoneNumber,
          ],
        })
        .andWhere('data.registrationId = registration.id')
        .groupBy('data.id')
        .limit(1);
    }, 'paymentAddress');
    return q;
  }

  // TODO: The query builders parts of this function should be defined in a repository, however it will be changed when implementing segregation of duties, so let's leave the refactor until than
  private async getPaymentListForRetry(
    projectId: number,
    paymentId: number,
    userId: number,
    referenceIds?: string[],
  ): Promise<PaPaymentRetryDataDto[]> {
    let q = this.getPaymentRegistrationsQuery(projectId);
    q = this.failedTransactionForRegistrationAndPayment(q, paymentId);

    q.addSelect('"fspConfig"."name" as "projectFspConfigurationName"');

    // If referenceIds passed, only retry those
    let rawResult;
    if (referenceIds && referenceIds.length > 0) {
      q.andWhere('registration."referenceId" IN (:...referenceIds)', {
        referenceIds,
      });
      rawResult = await q.getRawMany();
      for (const row of rawResult) {
        if (!row.transactionId) {
          const errors = `No failed transaction found for registration with referenceId ${row.referenceId}.`;
          throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
        }
      }
    } else {
      // If no referenceIds passed, retry all failed transactions for this payment
      // .. get all failed referenceIds for this payment
      const failedReferenceIds = (
        await this.transactionsService.getLastTransactions({
          projectId,
          paymentId,
          referenceId: undefined,
          status: TransactionStatusEnum.error,
        })
      ).map((t) => t.referenceId);
      // .. if nothing found, throw an error
      if (!failedReferenceIds.length) {
        const errors = 'No failed transactions found for this payment.';
        throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
      }
      q.andWhere('"referenceId" IN (:...failedReferenceIds)', {
        failedReferenceIds,
      });
      rawResult = await q.getRawMany();
    }
    const result: PaPaymentRetryDataDto[] = [];
    for (const row of rawResult) {
      row['userId'] = userId;
      result.push(row);
    }
    return result;
  }

  // TODO: The query builders parts of this function should be defined in a repository, however it will be changed when implementing segregation of duties, so let's leave the refactor until than
  private async getPaymentList(
    referenceIds: string[],
    amount: number,
    projectId: number,
    userId: number,
    bulkSize: number,
  ): Promise<PaPaymentDataDto[]> {
    const q = this.getPaymentRegistrationsQuery(projectId);
    q.addSelect('registration."paymentAmountMultiplier"');
    q.andWhere('registration."referenceId" IN (:...referenceIds)', {
      referenceIds,
    });
    const result = await q.getRawMany();
    const paPaymentDataList: PaPaymentDataDto[] = [];
    for (const row of result) {
      const paPaymentData: PaPaymentDataDto = {
        userId,
        projectFspConfigurationId: row.projectFspConfigurationId,
        transactionAmount: amount * row.paymentAmountMultiplier,
        referenceId: row.referenceId,
        paymentAddress: row.paymentAddress,
        fspName: row.fspName,
        bulkSize,
      };
      paPaymentDataList.push(paPaymentData);
    }
    return paPaymentDataList;
  }
}
