import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { PaginateQuery } from 'nestjs-paginate';
import { DataSource, Equal, In, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { AdditionalActionType } from '@121-service/src/actions/action.entity';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { FinancialServiceProviderAttributes } from '@121-service/src/financial-service-providers/enum/financial-service-provider-attributes.enum';
import { FinancialServiceProviderIntegrationType } from '@121-service/src/financial-service-providers/enum/financial-service-provider-integration-type.enum';
import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import {
  getFinancialServiceProviderConfigurationRequiredProperties,
  getFinancialServiceProviderSettingByNameOrThrow,
} from '@121-service/src/financial-service-providers/financial-service-provider-settings.helpers';
import { FINANCIAL_SERVICE_PROVIDER_SETTINGS } from '@121-service/src/financial-service-providers/financial-service-providers-settings.const';
import { FspInstructions } from '@121-service/src/payments/dto/fsp-instructions.dto';
import { GetImportTemplateResponseDto } from '@121-service/src/payments/dto/get-import-template-response.dto';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { PaPaymentRetryDataDto } from '@121-service/src/payments/dto/pa-payment-retry-data.dto';
import { PaTransactionResultDto } from '@121-service/src/payments/dto/payment-transaction-result.dto';
import { ProgramPaymentsStatusDto } from '@121-service/src/payments/dto/program-payments-status.dto';
import { ReconciliationFeedbackDto } from '@121-service/src/payments/dto/reconciliation-feedback.dto';
import { SplitPaymentListDto } from '@121-service/src/payments/dto/split-payment-lists.dto';
import { CommercialBankEthiopiaService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.service';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { ReferenceIdAndTransactionAmountInterface } from '@121-service/src/payments/interfaces/referenceid-transaction-amount.interface';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import {
  PaymentReturnDto,
  TransactionReturnDto,
} from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/entities/program-financial-service-provider-configuration.entity';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import {
  BulkActionResultPaymentDto,
  BulkActionResultRetryPaymentDto,
} from '@121-service/src/registration/dto/bulk-action-result.dto';
import { ImportStatus } from '@121-service/src/registration/dto/bulk-import.dto';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { ReferenceIdsDto } from '@121-service/src/registration/dto/reference-id.dto';
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
import { IntersolveVisaTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { SafaricomTransactionJobDto } from '@121-service/src/transaction-queues/dto/safaricom-transaction-job.dto';
import { TransactionQueuesService } from '@121-service/src/transaction-queues/transaction-queues.service';
import { splitArrayIntoChunks } from '@121-service/src/utils/chunk.helper';

@Injectable()
export class PaymentsService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(TransactionEntity)
  private readonly transactionRepository: Repository<TransactionEntity>;

  private financialServiceProviderNameToServiceMap: Record<
    FinancialServiceProviders,
    [FinancialServiceProviderIntegrationInterface, useWhatsapp?: boolean]
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
    private readonly commercialBankEthiopiaService: CommercialBankEthiopiaService,
    private readonly excelService: ExcelService,
    private readonly registrationsBulkService: RegistrationsBulkService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly dataSource: DataSource,
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly transactionQueuesService: TransactionQueuesService,
    private readonly programFinancialServiceProviderConfigurationRepository: ProgramFinancialServiceProviderConfigurationRepository,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {
    this.financialServiceProviderNameToServiceMap = {
      [FinancialServiceProviders.intersolveVoucherWhatsapp]: [
        this.intersolveVoucherService,
        true,
      ],
      [FinancialServiceProviders.intersolveVoucherPaper]: [
        this.intersolveVoucherService,
        false,
      ],
      // TODO: REFACTOR: This should be refactored after the other FSPs (all except Intersolve Visa) are also refactored.
      [FinancialServiceProviders.intersolveVisa]: [this.intersolveVisaService],
      [FinancialServiceProviders.safaricom]: [this.safaricomService],
      [FinancialServiceProviders.commercialBankEthiopia]: [
        this.commercialBankEthiopiaService,
      ],
      [FinancialServiceProviders.excel]: [this.excelService],
      [FinancialServiceProviders.deprecatedJumbo]: [
        {} as FinancialServiceProviderIntegrationInterface,
      ],
    };
  }

  public async getPayments(programId: number) {
    // Use unscoped repository, as you might not be able to select the correct payment in the portal otherwise
    const payments: {
      payment: number;
      paymentDate: Date | string;
    }[] = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('payment')
      .addSelect('MIN(transaction.created)', 'paymentDate')
      .andWhere('transaction.program.id = :programId', {
        programId,
      })
      .groupBy('payment')
      .orderBy('MIN(transaction.created)', 'ASC')
      .getRawMany();
    return payments;
  }

  private async aggregateTransactionsByStatus(
    programId: number,
    payment: number,
  ): Promise<any[]> {
    return await this.dataSource
      .createQueryBuilder()
      .select(['status', 'COUNT(*) as count', 'SUM(amount) as totalAmount'])
      .from(
        '(' +
          this.transactionScopedRepository
            .getLastTransactionsQuery({ programId, payment })
            .getQuery() +
          ')',
        'transactions',
      )
      .setParameters(
        this.transactionScopedRepository
          .getLastTransactionsQuery({ programId, payment })
          .getParameters(),
      )
      .groupBy('status')
      .getRawMany();
  }

  public async getPaymentAggregation(
    programId: number,
    payment: number,
  ): Promise<PaymentReturnDto> {
    // Scoped, as this.transactionScopedRepository is used in the transaction.service.ts
    const statusAggregation = await this.aggregateTransactionsByStatus(
      programId,
      payment,
    );
    const totalAmountPerStatus = statusAggregation.reduce(
      (acc, row) => {
        acc[row.status] = {
          count: (acc[row.status]?.count || 0) + Number(row.count || 0),
          amount: (acc[row.status]?.amount || 0) + (row.totalamount || 0),
        };
        return acc;
      },
      {} as Record<string, { count: number; amount: number }>,
    );

    return {
      success: totalAmountPerStatus[TransactionStatusEnum.success] || {
        count: 0,
        amount: 0,
      },
      waiting: totalAmountPerStatus[TransactionStatusEnum.waiting] || {
        count: 0,
        amount: 0,
      },
      failed: totalAmountPerStatus[TransactionStatusEnum.error] || {
        count: 0,
        amount: 0,
      },
    };
  }

  public async postPayment(
    userId: number,
    programId: number,
    payment: number,
    amount: number | undefined,
    query: PaginateQuery,
    dryRun: boolean,
  ): Promise<BulkActionResultPaymentDto> {
    if (!dryRun) {
      await this.checkPaymentInProgressAndThrow(programId);
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
        programId,
        this.getPaymentBaseQuery(payment), // We need to create a seperate querybuilder object twice or it will be modified twice
      );

    // If amount is not defined do not calculate the totalMultiplierSum
    // This happens when you call the endpoint with dryRun=true
    // Calling with dryrun is true happens in the pa table when you try to do a payment to decide which registrations are selectable
    if (!amount) {
      return {
        ...bulkActionResultDto,
        sumPaymentAmountMultiplier: 0,
        programFinancialServiceProviderConfigurationNames: [],
      };
    }

    // Get array of RegistrationViewEntity objects to be paid
    const registrationsForPayment =
      await this.getRegistrationsForPaymentChunked(
        programId,
        payment,
        paginateQuery,
      );

    // Calculate the totalMultiplierSum and create an array with all FSPs for this payment
    // Get the sum of the paymentAmountMultiplier of all registrations to calculate the total amount of money to be paid in frontend
    let totalMultiplierSum = 0;
    // This loop is pretty fast: with 131k registrations it takes ~38ms

    for (const registration of registrationsForPayment) {
      totalMultiplierSum =
        totalMultiplierSum + registration.paymentAmountMultiplier;
      // This is only needed in actual doPayment call
    }

    // Get unique programFinancialServiceProviderConfigurationNames in payment
    // Getting unique programFinancialServiceProviderConfigurationNames is relatively: with 131k registrations it takes ~36ms locally
    const programFinancialServiceProviderConfigurationNames = Array.from(
      new Set(
        registrationsForPayment.map(
          (registration) =>
            registration.programFinancialServiceProviderConfigurationName,
        ),
      ),
    );

    // Fill bulkActionResultPaymentDto with bulkActionResultDto and additional payment specific data
    const bulkActionResultPaymentDto = {
      ...bulkActionResultDto,
      sumPaymentAmountMultiplier: totalMultiplierSum,
      programFinancialServiceProviderConfigurationNames,
    };

    // Create an array of referenceIds to be paid
    const referenceIds = registrationsForPayment.map(
      (registration) => registration.referenceId,
    );

    if (!dryRun && referenceIds.length > 0) {
      await this.checkFspConfigurationsOrThrow(
        programId,
        programFinancialServiceProviderConfigurationNames,
      );

      // TODO: REFACTOR: userId not be passed down, but should be available in a context object; registrationsForPayment.length is redundant, as it is the same as referenceIds.length
      void this.initiatePayment(
        userId,
        programId,
        payment,
        amount,
        referenceIds,
        referenceIds.length,
      )
        .catch((e) => {
          this.azureLogService.logError(e, true);
        })
        .finally(() => {
          void this.actionService.saveAction(
            userId,
            programId,
            AdditionalActionType.paymentFinished,
          );
        });
    }

    return bulkActionResultPaymentDto;
  }

  private async checkFspConfigurationsOrThrow(
    programId: number,
    programFinancialServiceProviderConfigurationNames: string[],
  ): Promise<void> {
    const validationResults = await Promise.all(
      programFinancialServiceProviderConfigurationNames.map((name) =>
        this.validateMissingFspConfigurations(programId, name),
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
    programId: number,
    programFinancialServiceProviderConfigurationName: string,
  ): Promise<string[]> {
    const config =
      await this.programFinancialServiceProviderConfigurationRepository.findOne(
        {
          where: {
            name: Equal(programFinancialServiceProviderConfigurationName),
            programId: Equal(programId),
          },
          relations: ['properties'],
        },
      );

    const errorMessages: string[] = [];
    if (!config) {
      errorMessages.push(
        `Missing Program FSP configuration with name ${programFinancialServiceProviderConfigurationName}`,
      );
      return errorMessages;
    }

    const requiredConfigurations =
      getFinancialServiceProviderConfigurationRequiredProperties(
        config.financialServiceProviderName,
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
          `Missing required configuration ${requiredConfiguration} for FSP ${config.financialServiceProviderName}`,
        );
      }
    }

    return errorMessages;
  }

  private async getRegistrationsForPaymentChunked(
    programId: number,
    payment: number,
    paginateQuery: PaginateQuery,
  ) {
    const chunkSize = 4000;

    return await this.registrationsPaginationService.getRegistrationsChunked(
      programId,
      paginateQuery,
      chunkSize,
      this.getPaymentBaseQuery(payment),
    );
  }

  private getPaymentBaseQuery(
    payment: number,
  ): ScopedQueryBuilder<RegistrationViewEntity> {
    // Do not do payment if a registration has already one transaction for that payment number
    return this.registrationsBulkService
      .getBaseQuery()
      .leftJoin(
        'registration.latestTransactions',
        'latest_transaction_join',
        'latest_transaction_join.payment = :payment',
        { payment },
      )
      .andWhere('latest_transaction_join.id is null')
      .andWhere('registration.status = :status', {
        status: RegistrationStatusEnum.included,
      });
  }

  public async initiatePayment(
    userId: number,
    programId: number,
    payment: number,
    amount: number,
    referenceIds: string[],
    bulkSize: number,
  ): Promise<number> {
    await this.actionService.saveAction(
      userId,
      programId,
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
        programId,
        userId,
        bulkSize,
      );

      const result = await this.payout({
        paPaymentDataList,
        programId,
        payment,
        isRetry: false,
      });

      paymentTransactionResult += result;
    }
    return paymentTransactionResult;
  }

  public async retryPayment(
    userId: number,
    programId: number,
    payment: number,
    referenceIdsDto?: ReferenceIdsDto,
  ): Promise<BulkActionResultRetryPaymentDto> {
    await this.checkPaymentInProgressAndThrow(programId);

    await this.getProgramWithFspConfigOrThrow(programId);

    const paPaymentDataList = await this.getPaymentListForRetry(
      programId,
      payment,
      userId,
      referenceIdsDto?.referenceIds,
    );

    if (paPaymentDataList.length < 1) {
      const errors = 'There are no targeted PAs for this payment';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    await this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.paymentStarted,
    );

    void this.payout({ paPaymentDataList, programId, payment, isRetry: true })
      .catch((e) => {
        this.azureLogService.logError(e, true);
      })
      .finally(() => {
        void this.actionService.saveAction(
          userId,
          programId,
          AdditionalActionType.paymentFinished,
        );
      });

    const programFinancialServiceProviderConfigurationNames: string[] = [];
    // This loop is pretty fast: with 131k registrations it takes ~38ms
    for (const registration of paPaymentDataList) {
      if (
        !programFinancialServiceProviderConfigurationNames.includes(
          registration.programFinancialServiceProviderConfigurationName,
        )
      ) {
        programFinancialServiceProviderConfigurationNames.push(
          registration.programFinancialServiceProviderConfigurationName,
        );
      }
    }

    return {
      totalFilterCount: paPaymentDataList.length,
      applicableCount: paPaymentDataList.length,
      nonApplicableCount: 0,
      programFinancialServiceProviderConfigurationNames,
    };
  }

  private async getProgramWithFspConfigOrThrow(
    programId: number,
  ): Promise<ProgramEntity> {
    const program = await this.programRepository.findOne({
      where: { id: Equal(programId) },
      relations: ['programFinancialServiceProviderConfigurations'],
    });
    if (!program) {
      const errors = 'Program not found.';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return program;
  }

  public async payout({
    paPaymentDataList,
    programId,
    payment,
    isRetry = false,
  }: {
    paPaymentDataList: PaPaymentDataDto[];
    programId: number;
    payment: number;
    isRetry?: boolean;
  }): Promise<number> {
    // Create an object with an array of PA data for each FSP
    const paLists = this.splitPaListByFsp(paPaymentDataList);

    await this.initiatePaymentPerFinancialServiceProvider({
      paLists,
      programId,
      payment,
      isRetry,
    });

    return paPaymentDataList.length;
  }

  public async getProgramPaymentsStatus(
    programId: number,
  ): Promise<ProgramPaymentsStatusDto> {
    return {
      inProgress: await this.isPaymentInProgress(programId),
    };
  }

  private async checkPaymentInProgressAndThrow(
    programId: number,
  ): Promise<void> {
    if (await this.isPaymentInProgress(programId)) {
      throw new HttpException(
        { errors: 'Payment is already in progress' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async isPaymentInProgress(programId: number): Promise<boolean> {
    // TODO: REFACTOR: Remove this call, as we want to remove the Actions Module altogether.
    // Ruben: I would be careful with this refactor. The action table is update much earlies than the queue. So for a big payment it can take while for the queue to start. So if we remove the actions table we need something else..
    // check progress based on actions-table first
    // Check if there are any actions in progress
    const actionsInProgress =
      await this.checkPaymentActionInProgress(programId);
    if (actionsInProgress) {
      return true;
    }

    // If no actions in progress, check if there are any payments in progress in the queue
    return await this.isPaymentInProgressForProgramQueue(programId);
  }

  private async checkPaymentActionInProgress(
    programId: number,
  ): Promise<boolean> {
    const latestPaymentStartedAction = await this.actionService.getLatestAction(
      programId,
      AdditionalActionType.paymentStarted,
    );
    // TODO: REFACTOR: Use the Redis way of determining if a payment is in progress, see function this.checkFspQueueProgress
    // Ruben: I would be careful with this refactor. The action table is update much earlier in the payment api call than the queue. So for a big payment it can take while for the queue to start and a browser/person could potentially start the same payment twice
    // If never started, then not in progress, return early
    if (!latestPaymentStartedAction) {
      return false;
    }

    const latestPaymentFinishedAction =
      await this.actionService.getLatestAction(
        programId,
        AdditionalActionType.paymentFinished,
      );
    // If started, but never finished, then in progress
    if (!latestPaymentFinishedAction) {
      return true;
    }
    // If started and finished, then compare timestamps
    const startTimestamp = new Date(latestPaymentStartedAction?.created);
    const finishTimestamp = new Date(latestPaymentFinishedAction?.created);
    return finishTimestamp < startTimestamp;
  }

  private async isPaymentInProgressForProgramQueue(
    programId: number,
  ): Promise<boolean> {
    // If there is more that one program with the same FSP we can use the delayed count of a program which is faster else we need to do use the redis set
    const nrPending = await this.redisClient.scard(getRedisSetName(programId));
    const paymentIsInProgress = nrPending > 0;
    return paymentIsInProgress;
  }

  private splitPaListByFsp(
    paPaymentDataList: PaPaymentDataDto[],
  ): SplitPaymentListDto {
    return paPaymentDataList.reduce(
      (acc: SplitPaymentListDto, paPaymentData) => {
        if (!acc[paPaymentData.financialServiceProviderName]) {
          acc[paPaymentData.financialServiceProviderName] = [];
        }
        acc[paPaymentData.financialServiceProviderName]!.push(paPaymentData);
        return acc;
      },
      {},
    );
  }

  private async initiatePaymentPerFinancialServiceProvider({
    paLists,
    programId,
    payment,
    isRetry,
  }: {
    paLists: SplitPaymentListDto;
    programId: number;
    payment: number;
    isRetry: boolean;
  }): Promise<void> {
    await Promise.all(
      Object.entries(paLists).map(async ([fsp, paPaymentList]) => {
        if (fsp === FinancialServiceProviders.intersolveVisa) {
          /*
            TODO: REFACTOR: We need to refactor the Payments Service during segregation of duties implementation, so that the Payments Service calls a private function per FSP with a list of ReferenceIds (or RegistrationIds ?!)
            which then gathers the necessary data to create transaction jobs for the FSP.

            Until then, we do a temporary hack here for Intersolve Visa, mapping paPaymentList to only a list of referenceIds. The only thing is we do not know here if this is a retry.
            See this.createIntersolveVisaTransferJobs() of how this is handled.
          */

          return await this.createAndAddIntersolveVisaTransactionJobs({
            referenceIdsAndTransactionAmounts: paPaymentList.map(
              (paPaymentData) => {
                return {
                  referenceId: paPaymentData.referenceId,
                  transactionAmount: paPaymentData.transactionAmount,
                };
              },
            ),
            userId: paPaymentList[0].userId,
            programId,
            paymentNumber: payment,
            isRetry,
          });
        }

        if (fsp === FinancialServiceProviders.safaricom) {
          return await this.createAndAddSafaricomTransactionJobs({
            referenceIdsAndTransactionAmounts: paPaymentList.map(
              (paPaymentData) => {
                return {
                  referenceId: paPaymentData.referenceId,
                  transactionAmount: paPaymentData.transactionAmount,
                };
              },
            ),
            userId: paPaymentList[0].userId,
            programId,
            paymentNumber: payment,
            isRetry,
          });
        }

        const [paymentService, useWhatsapp] =
          this.financialServiceProviderNameToServiceMap[fsp];
        return await paymentService.sendPayment(
          paPaymentList,
          programId,
          payment,
          useWhatsapp,
        );
      }),
    );
  }

  /**
   * Creates and adds Intersolve Visa transaction jobs.
   *
   * This method is responsible for creating transaction jobs for Intersolve Visa. It fetches necessary PA data and maps it to a FSP specific DTO.
   * It then adds these jobs to the transaction queue.
   *
   * @param {string[]} referenceIds - The reference IDs for the transaction jobs.
   * @param {number} programId - The ID of the program.
   * @param {number} paymentAmount - The amount to be transferred.
   * @param {number} paymentNumber - The payment number.
   * @param {boolean} isRetry - Whether this is a retry.
   *
   * @returns {Promise<void>} A promise that resolves when the transaction jobs have been created and added.
   *
   */
  private async createAndAddIntersolveVisaTransactionJobs({
    referenceIdsAndTransactionAmounts: referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentNumber,
    isRetry,
  }: {
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentNumber: number;
    isRetry: boolean;
  }): Promise<void> {
    //  TODO: REFACTOR: This 'ugly' code is now also in registrations.service.reissueCardAndSendMessage. This should be refactored when there's a better way of getting registration data.
    const intersolveVisaAttributes =
      getFinancialServiceProviderSettingByNameOrThrow(
        FinancialServiceProviders.intersolveVisa,
      ).attributes;
    const intersolveVisaAttributeNames = intersolveVisaAttributes.map(
      (q) => q.name,
    );
    const dataFieldNames = [
      FinancialServiceProviderAttributes.fullName,
      FinancialServiceProviderAttributes.phoneNumber,
      ...intersolveVisaAttributeNames,
    ];
    const registrationViews = await this.getRegistrationViews(
      referenceIdsTransactionAmounts,
      dataFieldNames,
      programId,
    );

    // Convert the array into a map for increased performace (hashmap lookup)
    const transactionAmountsMap = new Map(
      referenceIdsTransactionAmounts.map((item) => [
        item.referenceId,
        item.transactionAmount,
      ]),
    );

    const intersolveVisaTransferJobs: IntersolveVisaTransactionJobDto[] =
      registrationViews.map(
        (registrationView): IntersolveVisaTransactionJobDto => {
          return {
            programId,
            userId,
            paymentNumber,
            referenceId: registrationView.referenceId,
            programFinancialServiceProviderConfigurationId:
              registrationView.programFinancialServiceProviderConfigurationId,
            // Use hashmap to lookup transaction amount for this referenceId (with the 4000 chuncksize this takes less than 1ms)
            transactionAmountInMajorUnit: transactionAmountsMap.get(
              registrationView.referenceId,
            )!,
            isRetry,
            bulkSize: referenceIdsTransactionAmounts.length,
            name: registrationView[
              FinancialServiceProviderAttributes.fullName
            ]!, // Fullname is a required field if a registration has visa as FSP
            addressStreet:
              registrationView[
                FinancialServiceProviderAttributes.addressStreet
              ],
            addressHouseNumber:
              registrationView[
                FinancialServiceProviderAttributes.addressHouseNumber
              ],
            addressHouseNumberAddition:
              registrationView[
                FinancialServiceProviderAttributes.addressHouseNumberAddition
              ],
            addressPostalCode:
              registrationView[
                FinancialServiceProviderAttributes.addressPostalCode
              ],
            addressCity:
              registrationView[FinancialServiceProviderAttributes.addressCity],
            phoneNumber: registrationView.phoneNumber!, // Phonenumber is a required field if a registration has visa as FSP
          };
        },
      );
    await this.transactionQueuesService.addIntersolveVisaTransactionJobs(
      intersolveVisaTransferJobs,
    );
  }

  /**
   * Creates and adds safaricom transaction jobs.
   *
   * This method is responsible for creating transaction jobs for Safaricom. It fetches necessary PA data and maps it to a FSP specific DTO.
   * It then adds these jobs to the transaction queue.
   *
   * @returns {Promise<void>} A promise that resolves when the transaction jobs have been created and added.
   *
   */
  private async createAndAddSafaricomTransactionJobs({
    referenceIdsAndTransactionAmounts: referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentNumber,
    isRetry,
  }: {
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentNumber: number;
    isRetry: boolean;
  }): Promise<void> {
    const safaricomAttributes = getFinancialServiceProviderSettingByNameOrThrow(
      FinancialServiceProviders.safaricom,
    ).attributes;
    const safaricomAttributeNames = safaricomAttributes.map((q) => q.name);
    const registrationViews = await this.getRegistrationViews(
      referenceIdsTransactionAmounts,
      safaricomAttributeNames,
      programId,
    );

    // Convert the array into a map for increased performace (hashmap lookup)
    const transactionAmountsMap = new Map(
      referenceIdsTransactionAmounts.map((item) => [
        item.referenceId,
        item.transactionAmount,
      ]),
    );

    const safaricomTransferJobs: SafaricomTransactionJobDto[] =
      registrationViews.map((registrationView): SafaricomTransactionJobDto => {
        return {
          programId,
          paymentNumber,
          referenceId: registrationView.referenceId,
          programFinancialServiceProviderConfigurationId:
            registrationView.programFinancialServiceProviderConfigurationId,
          transactionAmount: transactionAmountsMap.get(
            registrationView.referenceId,
          )!,
          isRetry,
          userId,
          bulkSize: referenceIdsTransactionAmounts.length,
          phoneNumber: registrationView.phoneNumber!, // Phonenumber is a required field if a registration has safaricom as FSP
          idNumber:
            registrationView[FinancialServiceProviderAttributes.nationalId],
          originatorConversationId: uuid(), // OriginatorConversationId is not used for reconciliation by clients, so can be any random unique identifier
        };
      });
    await this.transactionQueuesService.addSafaricomTransactionJobs(
      safaricomTransferJobs,
    );
  }

  private async getRegistrationViews(
    referenceIdsTransactionAmounts: ReferenceIdAndTransactionAmountInterface[],
    dataFieldNames: string[],
    programId: number,
  ): Promise<MappedPaginatedRegistrationDto[]> {
    const referenceIds = referenceIdsTransactionAmounts.map(
      (r) => r.referenceId,
    );
    const paginateQuery =
      this.registrationsBulkService.getRegistrationsForPaymentQuery(
        referenceIds,
        dataFieldNames,
      );

    const registrationViews =
      await this.registrationsPaginationService.getRegistrationsChunked(
        programId,
        paginateQuery,
        4000,
      );
    return registrationViews;
  }

  private failedTransactionForRegistrationAndPayment(
    q: ScopedQueryBuilder<RegistrationEntity>,
    payment: number,
  ): ScopedQueryBuilder<RegistrationEntity> {
    q.leftJoin(
      (qb) =>
        qb
          .from(TransactionEntity, 'transactions')
          .select('MAX("created")', 'created')
          .addSelect('"payment"', 'payment')
          .andWhere('"payment" = :payment', { payment })
          .groupBy('"payment"')
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
      AND transaction.payment = transaction_max_created.payment
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

  private getPaymentRegistrationsQuery(
    programId: number,
  ): ScopedQueryBuilder<RegistrationEntity> {
    const q = this.registrationScopedRepository
      .createQueryBuilder('registration')
      .select('"referenceId"')
      .addSelect('registration.id as id')
      .addSelect(
        '"fspConfig"."financialServiceProviderName" as "financialServiceProviderName"',
      )
      .addSelect(
        '"fspConfig"."id" as "programFinancialServiceProviderConfigurationId"',
      )
      .andWhere('registration."programId" = :programId', { programId })
      .leftJoin(
        'registration.programFinancialServiceProviderConfiguration',
        'fspConfig',
      );
    q.addSelect((subQuery) => {
      return subQuery
        .addSelect('value', 'paymentAddress')
        .from(RegistrationAttributeDataEntity, 'data')
        .leftJoin('data.programRegistrationAttribute', 'attribute')
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

  private async getPaymentListForRetry(
    programId: number,
    payment: number,
    userId: number,
    referenceIds?: string[],
  ): Promise<PaPaymentRetryDataDto[]> {
    let q = this.getPaymentRegistrationsQuery(programId);
    q = this.failedTransactionForRegistrationAndPayment(q, payment);

    q.addSelect(
      '"fspConfig"."name" as "programFinancialServiceProviderConfigurationName"',
    );

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
        await this.transactionsService.getLastTransactions(
          programId,
          payment,
          undefined,
          TransactionStatusEnum.error,
        )
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

  private async getPaymentList(
    referenceIds: string[],
    amount: number,
    programId: number,
    userId: number,
    bulkSize: number,
  ): Promise<PaPaymentDataDto[]> {
    const q = this.getPaymentRegistrationsQuery(programId);
    q.addSelect('registration."paymentAmountMultiplier"');
    q.andWhere('registration."referenceId" IN (:...referenceIds)', {
      referenceIds,
    });
    const result = await q.getRawMany();
    const paPaymentDataList: PaPaymentDataDto[] = [];
    for (const row of result) {
      const paPaymentData: PaPaymentDataDto = {
        userId,
        programFinancialServiceProviderConfigurationId:
          row.programFinancialServiceProviderConfigurationId,
        transactionAmount: amount * row.paymentAmountMultiplier,
        referenceId: row.referenceId,
        paymentAddress: row.paymentAddress,
        financialServiceProviderName: row.financialServiceProviderName,
        bulkSize,
      };
      paPaymentDataList.push(paPaymentData);
    }
    return paPaymentDataList;
  }

  public async getImportInstructionsTemplate(
    programId: number,
  ): Promise<GetImportTemplateResponseDto[]> {
    const programWithExcelFspConfigs = await this.programRepository.findOne({
      where: {
        id: Equal(programId),
        programFinancialServiceProviderConfigurations: {
          financialServiceProviderName: Equal(FinancialServiceProviders.excel),
        },
      },
      relations: ['programFinancialServiceProviderConfigurations'],
      order: {
        programFinancialServiceProviderConfigurations: {
          name: 'ASC',
        },
      },
    });

    if (!programWithExcelFspConfigs) {
      throw new HttpException(
        'No program with `Excel` FSP found',
        HttpStatus.NOT_FOUND,
      );
    }

    const templates: GetImportTemplateResponseDto[] = [];
    for (const fspConfig of programWithExcelFspConfigs.programFinancialServiceProviderConfigurations) {
      const matchColumn = await this.excelService.getImportMatchColumn(
        fspConfig.id,
      );
      templates.push({
        name: fspConfig.name,
        template: [matchColumn, 'status'],
      });
    }

    return templates;
  }

  public async getFspInstructions(
    programId: number,
    payment: number,
    userId: number,
  ): Promise<FspInstructions[]> {
    const transactions = await this.transactionsService.getLastTransactions(
      programId,
      payment,
    );

    const programFspConfigEntitiesWithFspInstruction =
      await this.programFinancialServiceProviderConfigurationRepository.find({
        where: {
          programId: Equal(programId),
          financialServiceProviderName: In(
            this.getFspNamesThatRequireInstructions(),
          ),
        },
        order: {
          name: 'ASC',
        },
      });

    const transactionsWithFspInstruction =
      this.filterTransactionsWithFspInstructionBasedOnStatus(
        transactions,
        programFspConfigEntitiesWithFspInstruction,
      );

    if (transactionsWithFspInstruction.length === 0) {
      throw new HttpException(
        'No transactions found for this payment with FSPs that require to download payment instructions.',
        HttpStatus.NOT_FOUND,
      );
    }

    /// Seprate transactionsWithFspInstruction based on their programFinancialServiceProviderConfigurationName
    const allFspInstructions: FspInstructions[] = [];
    for (const fspConfigEntity of programFspConfigEntitiesWithFspInstruction) {
      const fspInstructions =
        await this.getFspInstructionsPerProgramFspConfiguration({
          programId,
          payment,
          transactions: transactionsWithFspInstruction.filter(
            (t) =>
              t.programFinancialServiceProviderConfigurationName ===
              fspConfigEntity.name,
          ),
          programFinancialServiceProviderConfigurationName:
            fspConfigEntity.name,
          programFinancialServiceProviderConfigurationId: fspConfigEntity.id,
          financialServiceProviderName:
            fspConfigEntity.financialServiceProviderName,
        });
      // Should we exclude empty instructions where fspInstructions.data.length is empty, I think it is clearer for the user if they than get an empty file
      allFspInstructions.push(fspInstructions);
    }

    await this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.exportFspInstructions,
    );
    return allFspInstructions;
  }

  private getFspNamesThatRequireInstructions(): string[] {
    return FINANCIAL_SERVICE_PROVIDER_SETTINGS.filter((fsp) =>
      [FinancialServiceProviderIntegrationType.csv].includes(
        fsp.integrationType,
      ),
    ).map((fsp) => fsp.name);
  }

  private filterTransactionsWithFspInstructionBasedOnStatus(
    transactions: TransactionReturnDto[],
    programFspConfigEntitiesWithFspInstruction: ProgramFinancialServiceProviderConfigurationEntity[],
  ): TransactionReturnDto[] {
    const programFspConfigNamesThatRequireInstructions =
      programFspConfigEntitiesWithFspInstruction.map((c) => c.name);

    const transactionsWithFspInstruction = transactions.filter((t) =>
      programFspConfigNamesThatRequireInstructions.includes(
        t.programFinancialServiceProviderConfigurationName,
      ),
    );

    const result: TransactionReturnDto[] = [];
    for (const transaction of transactionsWithFspInstruction) {
      if (
        // Only export waiting transactions, as others have already been reconciliated
        transaction.status === TransactionStatusEnum.waiting
      ) {
        result.push(transaction);
      }
    }
    return result;
  }

  private async getFspInstructionsPerProgramFspConfiguration({
    transactions,
    programId,
    payment,
    programFinancialServiceProviderConfigurationName,
    programFinancialServiceProviderConfigurationId,
    financialServiceProviderName,
  }: {
    transactions: TransactionReturnDto[];
    programId: number;
    payment: number;
    programFinancialServiceProviderConfigurationName: string;
    programFinancialServiceProviderConfigurationId: number;
    financialServiceProviderName: FinancialServiceProviders;
  }): Promise<FspInstructions> {
    if (financialServiceProviderName === FinancialServiceProviders.excel) {
      return {
        data: await this.excelService.getFspInstructions({
          transactions,
          programId,
          payment,
          programFinancialServiceProviderConfigurationId,
        }),
        fileNamePrefix: programFinancialServiceProviderConfigurationName,
      };
    }
    // Is this the best way to prevent a typeerror on the return type?
    throw new Error(
      `FinancialServiceProviderName ${financialServiceProviderName} not supported in fsp export`,
    );
  }

  public async importFspReconciliationData(
    file: Express.Multer.File,
    programId: number,
    payment: number,
    userId: number,
  ): Promise<{
    importResult: ReconciliationFeedbackDto[];
    aggregateImportResult: {
      countPaymentFailed: number;
      countPaymentSuccess: number;
      countNotFound: number;
    };
  }> {
    const program = await this.programRepository.findOneOrFail({
      where: {
        id: Equal(programId),
      },
      relations: ['programFinancialServiceProviderConfigurations'],
    });
    const fspConfigsExcel: ProgramFinancialServiceProviderConfigurationEntity[] =
      [];
    for (const fspConfig of program.programFinancialServiceProviderConfigurations) {
      if (
        fspConfig.financialServiceProviderName ===
        FinancialServiceProviders.excel
      ) {
        fspConfigsExcel.push(fspConfig);
      }
    }
    if (!fspConfigsExcel.length) {
      throw new HttpException(
        'Other reconciliation FSPs than `Excel` are currently not supported.',
        HttpStatus.NOT_FOUND,
      );
    }

    const importResults = await this.excelService.processReconciliationData({
      file,
      payment,
      programId,
      fspConfigs: fspConfigsExcel,
    });

    for (const fspConfig of fspConfigsExcel) {
      const transactions = importResults
        .filter(
          (r) =>
            r.programFinancialServiceProviderConfigurationId === fspConfig.id,
        )
        .map((r) => r.transaction)
        .filter((t): t is PaTransactionResultDto => t !== undefined);

      await this.transactionsService.storeReconciliationTransactionsBulk(
        transactions,
        {
          programId,
          paymentNr: payment,
          userId,
          programFinancialServiceProviderConfigurationId: fspConfig.id,
        },
      );
    }

    const feedback: ReconciliationFeedbackDto[] = importResults.map(
      (r) => r.feedback,
    );
    const aggregateImportResult = this.countFeedbackResults(feedback);

    await this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.importFspReconciliation,
    );

    return {
      importResult: feedback,
      aggregateImportResult,
    };
  }

  private countFeedbackResults(feedback: ReconciliationFeedbackDto[]): {
    countPaymentSuccess: number;
    countPaymentFailed: number;
    countNotFound: number;
  } {
    let countPaymentSuccess = 0;
    let countPaymentFailed = 0;
    let countNotFound = 0;

    for (const result of feedback) {
      if (!result.referenceId) {
        countNotFound += 1;
        continue;
      }
      if (result.importStatus === ImportStatus.paymentSuccess) {
        countPaymentSuccess += 1;
      } else if (result.importStatus === ImportStatus.paymentFailed) {
        countPaymentFailed += 1;
      } else if (result.importStatus === ImportStatus.notFound) {
        countNotFound += 1;
      }
    }

    return { countPaymentSuccess, countPaymentFailed, countNotFound };
  }
}
