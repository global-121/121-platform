import { AdditionalActionType } from '@121-service/src/actions/action.entity';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { FinancialServiceProviderIntegrationType } from '@121-service/src/financial-service-providers/enum/financial-service-provider-integration-type.enum';
import {
  FinancialServiceProviderName,
  RequiredFinancialServiceProviderConfigurations,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderQuestionRepository } from '@121-service/src/financial-service-providers/repositories/financial-service-provider-question.repository';
import {
  CsvInstructions,
  ExportFileType,
  FspInstructions,
} from '@121-service/src/payments/dto/fsp-instructions.dto';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { ProgramPaymentsStatusDto } from '@121-service/src/payments/dto/program-payments-status.dto';
import { SplitPaymentListDto } from '@121-service/src/payments/dto/split-payment-lists.dto';
import { CommercialBankEthiopiaService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.service';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { FinancialServiceProviderIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { VodacashService } from '@121-service/src/payments/fsp-integration/vodacash/vodacash.service';
import { ReferenceIdAndTransactionAmountInterface } from '@121-service/src/payments/interfaces/referenceid-transaction-amount.interface';
import {
  REDIS_CLIENT,
  getRedisSetName,
} from '@121-service/src/payments/redis/redis-client';
import { PaymentReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import {
  BulkActionResultPaymentDto,
  BulkActionResultRetryPaymentDto,
} from '@121-service/src/registration/dto/bulk-action-result.dto';
import {
  ImportResult,
  ImportStatus,
} from '@121-service/src/registration/dto/bulk-import.dto';
import { ReferenceIdsDto } from '@121-service/src/registration/dto/reference-id.dto';
import { CustomDataAttributes } from '@121-service/src/registration/enum/custom-data-attributes';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { ScopedQueryBuilder } from '@121-service/src/scoped.repository';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { IntersolveVisaTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { SafaricomTransactionJobDto } from '@121-service/src/transaction-queues/dto/safaricom-transaction-job.dto';
import { TransactionQueuesService } from '@121-service/src/transaction-queues/transaction-queues.service';
import { splitArrayIntoChunks } from '@121-service/src/utils/chunk.helper';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { PaginateQuery } from 'nestjs-paginate';
import { DataSource, Equal, Repository } from 'typeorm';

@Injectable()
export class PaymentsService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(TransactionEntity)
  private readonly transactionRepository: Repository<TransactionEntity>;

  private financialServiceProviderNameToServiceMap: Record<
    FinancialServiceProviderName,
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
    private readonly vodacashService: VodacashService,
    private readonly safaricomService: SafaricomService,
    private readonly commercialBankEthiopiaService: CommercialBankEthiopiaService,
    private readonly excelService: ExcelService,
    private readonly registrationsBulkService: RegistrationsBulkService,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly fileImportService: FileImportService,
    private readonly dataSource: DataSource,
    private readonly transactionQueuesService: TransactionQueuesService,
    private readonly financialServiceProviderQuestionRepository: FinancialServiceProviderQuestionRepository,
    private readonly programFinancialServiceProviderConfigurationRepository: ProgramFinancialServiceProviderConfigurationRepository,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {
    this.financialServiceProviderNameToServiceMap = {
      [FinancialServiceProviderName.intersolveVoucherWhatsapp]: [
        this.intersolveVoucherService,
        true,
      ],
      [FinancialServiceProviderName.intersolveVoucherPaper]: [
        this.intersolveVoucherService,
        false,
      ],
      // TODO: REFACTOR: This should be refactored after the other FSPs (all except Intersolve Visa) are also refactored.
      [FinancialServiceProviderName.intersolveVisa]: [
        this.intersolveVisaService,
      ],
      [FinancialServiceProviderName.vodacash]: [this.vodacashService],
      [FinancialServiceProviderName.safaricom]: [this.safaricomService],
      [FinancialServiceProviderName.commercialBankEthiopia]: [
        this.commercialBankEthiopiaService,
      ],
      [FinancialServiceProviderName.excel]: [this.excelService],
    };
  }

  public async getPayments(programId: number): Promise<
    {
      payment: number;
      paymentDate: Date | string;
      amount: number;
    }[]
  > {
    // Use unscoped repository, as you might not be able to select the correct payment in the portal otherwise
    const payments = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('payment')
      .addSelect('MIN(transaction.created)', 'paymentDate')
      .andWhere('transaction.program.id = :programId', {
        programId: programId,
      })
      .groupBy('payment')
      .getRawMany();
    return payments;
  }

  private async aggregateTransactionsByStatus(
    programId: number,
    payment: number,
  ): Promise<any[]> {
    return await this.dataSource
      .createQueryBuilder()
      .select(['status', 'COUNT(*) as count'])
      .from(
        '(' +
          this.transactionsService
            .getLastTransactionsQuery(programId, payment)
            .getQuery() +
          ')',
        'transactions',
      )
      .setParameters(
        this.transactionsService
          .getLastTransactionsQuery(programId, payment)
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
    return {
      nrSuccess:
        statusAggregation.find((row) => row.status === StatusEnum.success)
          ?.count || 0,
      nrWaiting:
        statusAggregation.find((row) => row.status === StatusEnum.waiting)
          ?.count || 0,
      nrError:
        statusAggregation.find((row) => row.status === StatusEnum.error)
          ?.count || 0,
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
      this.registrationsBulkService.setQueryPropertiesBulkAction(query, true);

    // Fill bulkActionResultDto with meta data of the payment being done
    const bulkActionResultDto =
      await this.registrationsBulkService.getBulkActionResult(
        paginateQuery,
        programId,
        this.getPaymentBaseQuery(payment), // We need to create a seperate querybuilder object twice or it will be modified twice
      );

    // If amount is not defined do not calculate the totalMultiplierSum
    // This happens when you call the endpoint with dryRun=true
    // happens in pa table to define which registrations are selectable
    if (!amount) {
      return {
        ...bulkActionResultDto,
        sumPaymentAmountMultiplier: 0,
        fspsInPayment: [],
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
    const fspsInPayment: FinancialServiceProviderName[] = [];
    // This loop is pretty fast: with 131k registrations it takes ~38ms
    for (const registration of registrationsForPayment) {
      totalMultiplierSum =
        totalMultiplierSum + registration.paymentAmountMultiplier;
      if (
        !dryRun && // This is only needed in actual doPayment call
        registration.financialServiceProvider &&
        !fspsInPayment.includes(registration.financialServiceProvider)
      ) {
        fspsInPayment.push(registration.financialServiceProvider);
      }
    }

    for (const fsp of fspsInPayment) {
      await this.validateRequiredFinancialServiceProviderConfigurations(
        fsp,
        programId,
      );
    }

    // Fill bulkActionResultPaymentDto with bulkActionResultDto and additional payment specific data
    const bulkActionResultPaymentDto = {
      ...bulkActionResultDto,
      sumPaymentAmountMultiplier: totalMultiplierSum,
      fspsInPayment: fspsInPayment,
    };

    // Create an array of referenceIds to be paid
    const referenceIds = registrationsForPayment.map(
      (registration) => registration.referenceId,
    );

    if (!dryRun && referenceIds.length > 0) {
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

  async validateRequiredFinancialServiceProviderConfigurations(
    fsp: string,
    programId: number,
  ) {
    const requiredConfigurations =
      RequiredFinancialServiceProviderConfigurations[
        fsp as FinancialServiceProviderName
      ];
    // Early return for FSP that don't have required configurarions
    if (!requiredConfigurations) {
      return;
    }
    const config =
      await this.programFinancialServiceProviderConfigurationRepository.findByProgramIdAndFinancialServiceProviderName(
        programId,
        fsp as FinancialServiceProviderName,
      );
    for (const requiredConfiguration of requiredConfigurations) {
      const foundConfig = config.find((c) => c.name === requiredConfiguration);
      if (!foundConfig) {
        throw new HttpException(
          {
            errors: `Missing required configuration ${requiredConfiguration} for FSP ${fsp}`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
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

    await this.getProgramWithFspOrThrow(programId);

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

    const fspsInPayment: FinancialServiceProviderName[] = [];
    // This loop is pretty fast: with 131k registrations it takes ~38ms
    for (const registration of paPaymentDataList) {
      if (!fspsInPayment.includes(registration.fspName)) {
        fspsInPayment.push(registration.fspName);
      }
    }

    return {
      totalFilterCount: paPaymentDataList.length,
      applicableCount: paPaymentDataList.length,
      nonApplicableCount: 0,
      fspsInPayment,
    };
  }

  private async getProgramWithFspOrThrow(
    programId: number,
  ): Promise<ProgramEntity> {
    const program = await this.programRepository.findOne({
      where: { id: Equal(programId) },
      relations: ['financialServiceProviders'],
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
    isRetry,
  }: {
    paPaymentDataList: PaPaymentDataDto[];
    programId: number;
    payment: number;
    isRetry: boolean;
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
    return paPaymentDataList.reduce((acc, paPaymentData) => {
      if (!acc[paPaymentData.fspName]) {
        acc[paPaymentData.fspName] = [];
      }
      acc[paPaymentData.fspName].push(paPaymentData);
      return acc;
    }, {});
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
        if (fsp === FinancialServiceProviderName.intersolveVisa) {
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

        if (fsp === FinancialServiceProviderName.safaricom) {
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
    const intersolveVisaQuestions =
      await this.financialServiceProviderQuestionRepository.getQuestionsByFspName(
        FinancialServiceProviderName.intersolveVisa,
      );
    const intersolveVisaQuestionNames = intersolveVisaQuestions.map(
      (q) => q.name,
    );
    const dataFieldNames = [
      'fullName',
      'phoneNumber',
      ...intersolveVisaQuestionNames,
    ];
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

    // Convert the array into a map for increased performace (hashmap lookup)
    const transactionAmountsMap = new Map(
      referenceIdsTransactionAmounts.map((item) => [
        item.referenceId,
        item.transactionAmount,
      ]),
    );

    console.log('registrationViews: ', registrationViews);
    const intersolveVisaTransferJobs: IntersolveVisaTransactionJobDto[] =
      registrationViews.map(
        (registrationView): IntersolveVisaTransactionJobDto => {
          return {
            programId: programId,
            userId: userId,
            paymentNumber: paymentNumber,
            referenceId: registrationView.referenceId,
            // Use hashmap to lookup transaction amount for this referenceId (with the 4000 chuncksize this takes less than 1ms)
            transactionAmountInMajorUnit: transactionAmountsMap.get(
              registrationView.referenceId,
            )!,
            isRetry,
            bulkSize: referenceIds.length,
            name: registrationView['fullName'],
            addressStreet: registrationView['addressStreet'],
            addressHouseNumber: registrationView['addressHouseNumber'],
            addressHouseNumberAddition:
              registrationView['addressHouseNumberAddition'],
            addressPostalCode: registrationView['addressPostalCode'],
            addressCity: registrationView['addressCity'],
            phoneNumber: registrationView.phoneNumber,
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
    const safaricomQuestions =
      await this.financialServiceProviderQuestionRepository.getQuestionsByFspName(
        FinancialServiceProviderName.safaricom,
      );
    const safaricomQuestionNames = safaricomQuestions.map((q) => q.name);
    const dataFieldNames = [
      'fullName',
      'phoneNumber',
      'nationalId',
      'registrationProgramId',
      ...safaricomQuestionNames,
    ];
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
          programId: programId,
          paymentNumber: paymentNumber,
          referenceId: registrationView.referenceId,
          transactionAmount: transactionAmountsMap.get(
            registrationView.referenceId,
          )!,
          isRetry,
          userId: userId,
          bulkSize: referenceIds.length,
          phoneNumber: registrationView.phoneNumber,
          nationalId: registrationView['nationalId'],
          registrationProgramId: registrationView.registrationProgramId,
        };
      });
    await this.transactionQueuesService.addSafaricomTransactionJobs(
      safaricomTransferJobs,
    );
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
      AND transaction.status = '${StatusEnum.error}'`,
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
      .addSelect('fsp.fsp as "fspName"')
      .andWhere('registration."programId" = :programId', { programId })
      .leftJoin('registration.fsp', 'fsp');
    q.addSelect((subQuery) => {
      return subQuery
        .addSelect('value', 'paymentAddress')
        .from(RegistrationDataEntity, 'data')
        .leftJoin('data.fspQuestion', 'question')
        .andWhere('question.name IN (:...names)', {
          names: [
            CustomDataAttributes.phoneNumber,
            CustomDataAttributes.whatsappPhoneNumber,
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
  ): Promise<PaPaymentDataDto[]> {
    let q = this.getPaymentRegistrationsQuery(programId);
    q = this.failedTransactionForRegistrationAndPayment(q, payment);

    // If referenceIds passed, only retry those
    let rawResult;
    if (referenceIds && referenceIds.length > 0) {
      q.andWhere('registration."referenceId" IN (:...referenceIds)', {
        referenceIds: referenceIds,
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
          StatusEnum.error,
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
    const result: PaPaymentDataDto[] = [];
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
      referenceIds: referenceIds,
    });
    const result = await q.getRawMany();
    const paPaymentDataList: PaPaymentDataDto[] = [];
    for (const row of result) {
      const paPaymentData: PaPaymentDataDto = {
        userId: userId,
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

  public async getImportInstructionsTemplate(
    programId: number,
  ): Promise<string[]> {
    const programWithReconciliationFsps = await this.programRepository.findOne({
      where: {
        id: Equal(programId),
        financialServiceProviders: {
          fsp: Equal(FinancialServiceProviderName.excel),
        },
      },
      relations: ['financialServiceProviders'],
      select: ['id'],
    });

    if (!programWithReconciliationFsps) {
      throw new HttpException('Program or FSP not found', HttpStatus.NOT_FOUND);
    }

    const matchColumn = await this.excelService.getImportMatchColumn(programId);
    return [matchColumn, 'status'];
  }

  public async getFspInstructions(
    programId: number,
    payment: number,
    userId: number,
  ): Promise<FspInstructions> {
    const exportPaymentTransactions = (
      await this.transactionsService.getLastTransactions(programId, payment)
    ).filter(
      (t) =>
        t.fspIntegrationType !== FinancialServiceProviderIntegrationType.api,
    );

    if (exportPaymentTransactions.length === 0) {
      throw new HttpException(
        'No transactions found for this payment with FSPs that require to download payment instructions.',
        HttpStatus.NOT_FOUND,
      );
    }

    let csvInstructions: CsvInstructions = [];
    let xmlInstructions: string | undefined;
    let fileType: ExportFileType | undefined;

    // REFACTOR: below code seems to facilitate multiple non-api FSPs in 1 payment, but does not actually handle this correctly.
    // REFACTOR: below code should be transformed to paginate-queries instead of per PA, like the Excel-FSP code below
    for await (const transaction of exportPaymentTransactions.filter(
      (t) => t.fsp !== FinancialServiceProviderName.excel,
    )) {
      const registration =
        await this.registrationScopedRepository.findOneOrFail({
          where: { referenceId: Equal(transaction.referenceId) },
          relations: ['fsp'],
        });

      if (
        // For fsp's with reconciliation export only export waiting transactions
        registration.fsp.hasReconciliation &&
        transaction.status !== StatusEnum.waiting
      ) {
        continue;
      }

      if (registration.fsp.fsp === FinancialServiceProviderName.vodacash) {
        xmlInstructions = await this.vodacashService.getFspInstructions(
          registration,
          transaction,
          xmlInstructions,
        );
        if (!fileType) {
          fileType = ExportFileType.xml;
        }
      }
    }

    // It is assumed the Excel FSP is not combined with other non-api FSPs above, and they are overwritten
    const excelTransactions = exportPaymentTransactions.filter(
      (t) =>
        t.fsp === FinancialServiceProviderName.excel &&
        t.status === StatusEnum.waiting, // only 'waiting' given that Excel FSP has reconciliation
    );
    if (excelTransactions.length) {
      csvInstructions = await this.excelService.getFspInstructions(
        excelTransactions,
        programId,
        payment,
      );
      fileType = ExportFileType.excel;
    }

    await this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.exportFspInstructions,
    );

    return {
      data: fileType === ExportFileType.xml ? xmlInstructions : csvInstructions,
      fileType: fileType,
    };
  }

  public async importFspReconciliationData(
    file,
    programId: number,
    payment: number,
    userId: number,
  ): Promise<ImportResult> {
    // REFACTOR: below code seems to facilitate multiple non-api FSPs in 1 payment, but does not actually handle this correctly.
    const programWithReconciliationFsps =
      await this.programRepository.findOneOrFail({
        where: {
          id: Equal(programId),
          financialServiceProviders: { hasReconciliation: Equal(true) },
        },
        relations: ['financialServiceProviders'],
      });

    let importResponseRecords: any[] = [];
    for await (const fsp of programWithReconciliationFsps.financialServiceProviders) {
      if (fsp.fsp === FinancialServiceProviderName.vodacash) {
        const vodacashRegistrations =
          await this.vodacashService.getRegistrationsForReconciliation(
            programId,
            payment,
          );
        if (!vodacashRegistrations?.length) {
          continue;
        }
        const validatedVodacashImport =
          await this.vodacashService.xmlToValidatedFspReconciliation(file);
        for (const record of validatedVodacashImport) {
          const matchedRegistration =
            await this.vodacashService.findReconciliationRegistration(
              record,
              vodacashRegistrations,
            );
          if (matchedRegistration) {
            record['paTransactionResult'] =
              await this.vodacashService.createTransactionResult(
                matchedRegistration.id,
                matchedRegistration.referenceId,
                record,
                programId,
                payment,
              );
          }
          importResponseRecords.push(record);
        }
      }

      if (fsp.fsp === FinancialServiceProviderName.excel) {
        const maxRecords = 10000;
        const matchColumn =
          await this.excelService.getImportMatchColumn(programId);
        const excelRegistrations =
          await this.excelService.getRegistrationsForReconciliation(
            programId,
            payment,
            matchColumn,
          );
        if (!excelRegistrations?.length) {
          continue;
        }
        const validatedExcelImport = await this.fileImportService.validateCsv(
          file,
          maxRecords,
        );
        const transactions = await this.transactionsService.getLastTransactions(
          programId,
          payment,
          undefined,
          undefined,
          FinancialServiceProviderName.excel,
        );
        importResponseRecords =
          this.excelService.joinRegistrationsAndImportRecords(
            excelRegistrations,
            validatedExcelImport,
            matchColumn,
            transactions,
          );
      }
    }

    let countPaymentSuccess = 0;
    let countPaymentFailed = 0;
    let countNotFound = 0;
    const transactionsToSave: any[] = [];
    for (const importResponseRecord of importResponseRecords) {
      if (!importResponseRecord.paTransactionResult) {
        importResponseRecord.importStatus = ImportStatus.notFound;
        countNotFound += 1;
        continue;
      }

      transactionsToSave.push(importResponseRecord.paTransactionResult);
      importResponseRecord.importStatus = ImportStatus.imported;
      countPaymentSuccess += Number(
        importResponseRecord.paTransactionResult.status === StatusEnum.success,
      );
      countPaymentFailed += Number(
        importResponseRecord.paTransactionResult.status === StatusEnum.error,
      );
      delete importResponseRecord.paTransactionResult;
    }

    if (transactionsToSave.length) {
      const transactionRelationDetails = {
        programId,
        paymentNr: payment,
        userId,
      };
      await this.transactionsService.storeAllTransactionsBulk(
        transactionsToSave,
        transactionRelationDetails,
      );
    }

    await this.actionService.saveAction(
      userId,
      programId,
      AdditionalActionType.importFspReconciliation,
    );

    return {
      importResult: importResponseRecords,
      aggregateImportResult: {
        countPaymentFailed,
        countPaymentSuccess,
        countNotFound,
      },
    };
  }
}
