import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { PaginateQuery } from 'nestjs-paginate';
import { DataSource, Equal, In, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { AdditionalActionType } from '@121-service/src/actions/action.entity';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import { FspIntegrationType } from '@121-service/src/fsps/enums/fsp-integration-type.enum';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import {
  getFspConfigurationRequiredProperties,
  getFspSettingByNameOrThrow,
} from '@121-service/src/fsps/fsp-settings.helpers';
import { FileDto } from '@121-service/src/metrics/dto/file.dto';
import { FspInstructions } from '@121-service/src/payments/dto/fsp-instructions.dto';
import { GetTransactionResponseDto } from '@121-service/src/payments/dto/get-transaction-response.dto';
import { PaPaymentDataDto } from '@121-service/src/payments/dto/pa-payment-data.dto';
import { PaPaymentRetryDataDto } from '@121-service/src/payments/dto/pa-payment-retry-data.dto';
import { ProgramPaymentsStatusDto } from '@121-service/src/payments/dto/program-payments-status.dto';
import { SplitPaymentListDto } from '@121-service/src/payments/dto/split-payment-lists.dto';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { AirtelService } from '@121-service/src/payments/fsp-integration/airtel/airtel.service';
import { CommercialBankEthiopiaService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.service';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { FspIntegrationInterface } from '@121-service/src/payments/fsp-integration/fsp-integration.interface';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.service';
import { NedbankService } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.service';
import { OnafriqService } from '@121-service/src/payments/fsp-integration/onafriq/onafriq.service';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { ReferenceIdAndTransactionAmountInterface } from '@121-service/src/payments/interfaces/referenceid-transaction-amount.interface';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { PaymentsHelperService } from '@121-service/src/payments/services/payments.helper.service';
import {
  PaymentReturnDto,
  TransactionReturnDto,
} from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';
import {
  BulkActionResultPaymentDto,
  BulkActionResultRetryPaymentDto,
} from '@121-service/src/registration/dto/bulk-action-result.dto';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { ReferenceIdsDto } from '@121-service/src/registration/dto/reference-ids.dto';
import {
  DefaultRegistrationDataAttributeNames,
  GenericRegistrationAttributes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationViewsMapper } from '@121-service/src/registration/mappers/registration-views.mapper';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationAttributeDataEntity } from '@121-service/src/registration/registration-attribute-data.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { ScopedQueryBuilder } from '@121-service/src/scoped.repository';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';
import { AirtelTransactionJobDto } from '@121-service/src/transaction-queues/dto/airtel-transaction-job.dto';
import { IntersolveVisaTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { NedbankTransactionJobDto } from '@121-service/src/transaction-queues/dto/nedbank-transaction-job.dto';
import { OnafriqTransactionJobDto } from '@121-service/src/transaction-queues/dto/onafriq-transaction-job.dto';
import { SafaricomTransactionJobDto } from '@121-service/src/transaction-queues/dto/safaricom-transaction-job.dto';
import { TransactionQueuesService } from '@121-service/src/transaction-queues/transaction-queues.service';
import { splitArrayIntoChunks } from '@121-service/src/utils/chunk.helper';

@Injectable()
export class PaymentsService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  @InjectRepository(PaymentEntity)
  private readonly paymentRepository: Repository<PaymentEntity>;

  private fspNameToServiceMap: Record<
    Fsps,
    [FspIntegrationInterface, useWhatsapp?: boolean]
  >;

  public constructor(
    private readonly paymentsHelperService: PaymentsHelperService,
    private readonly registrationScopedRepository: RegistrationScopedRepository,
    private readonly programRegistrationAttributeRepository: ProgramRegistrationAttributeRepository,
    private readonly registrationPaginationService: RegistrationsPaginationService,
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
    private readonly dataSource: DataSource,
    private readonly transactionScopedRepository: TransactionScopedRepository,
    private readonly transactionQueuesService: TransactionQueuesService,
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
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

  public async getPayments(programId: number) {
    const rawPayments = await this.paymentRepository.find({
      where: {
        programId: Equal(programId),
      },
      select: ['id', 'created'],
    });
    const payments = rawPayments.map((payment) => ({
      paymentId: payment.id,
      paymentDate: payment.created,
    }));
    return payments;
  }

  private async aggregateTransactionsByStatus(
    programId: number,
    paymentId: number,
  ): Promise<any[]> {
    return await this.dataSource
      .createQueryBuilder()
      .select([
        'status',
        'COUNT(*) as count',
        // rounding individual transaction amounts to 2 decimal places before summing, in line with current FSPs:
        'SUM(ROUND(amount::numeric, 2)) as totalamount',
      ])
      .from(
        '(' +
          this.transactionScopedRepository
            .getLastTransactionsQuery({ programId, paymentId })
            .getQuery() +
          ')',
        'transactions',
      )
      .setParameters(
        this.transactionScopedRepository
          .getLastTransactionsQuery({ programId, paymentId })
          .getParameters(),
      )
      .groupBy('status')
      .getRawMany();
  }

  public async getPaymentAggregation(
    programId: number,
    paymentId: number,
  ): Promise<PaymentReturnDto> {
    // Scoped, as this.transactionScopedRepository is used in the transaction.service.ts
    const statusAggregation = await this.aggregateTransactionsByStatus(
      programId,
      paymentId,
    );

    const totalAmountPerStatus: Record<
      string,
      { count: number; amount: number }
    > = {};

    for (const row of statusAggregation) {
      const status = row.status;

      if (!totalAmountPerStatus[status]) {
        totalAmountPerStatus[status] = {
          count: 0,
          amount: 0,
        };
      }

      totalAmountPerStatus[status].count = Number(row.count);
      totalAmountPerStatus[status].amount = Number(row.totalamount);
    }

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

  public async createPayment(
    userId: number,
    programId: number,
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
        this.getPaymentBaseQuery(), // We need to create a seperate querybuilder object twice or it will be modified twice
      );

    // If amount is not defined do not calculate the totalMultiplierSum
    // This happens when you call the endpoint with dryRun=true
    // Calling with dryrun is true happens in the pa table when you try to do a payment to decide which registrations are selectable
    if (!amount) {
      return {
        ...bulkActionResultDto,
        sumPaymentAmountMultiplier: 0,
        programFspConfigurationNames: [],
      };
    }

    // Get array of RegistrationViewEntity objects to be paid
    const registrationsForPayment =
      await this.getRegistrationsForPaymentChunked(programId, paginateQuery);

    // Calculate the totalMultiplierSum and create an array with all FSPs for this payment
    // Get the sum of the paymentAmountMultiplier of all registrations to calculate the total amount of money to be paid in frontend
    let totalMultiplierSum = 0;
    // This loop is pretty fast: with 131k registrations it takes ~38ms

    for (const registration of registrationsForPayment) {
      totalMultiplierSum =
        totalMultiplierSum + registration.paymentAmountMultiplier;
      // This is only needed in actual doPayment call
    }

    // Get unique programFspConfigurationNames in payment
    // Getting unique programFspConfigurationNames is relatively: with 131k registrations it takes ~36ms locally
    const programFspConfigurationNames = Array.from(
      new Set(
        registrationsForPayment.map(
          (registration) => registration.programFspConfigurationName,
        ),
      ),
    );

    // Fill bulkActionResultPaymentDto with bulkActionResultDto and additional payment specific data
    const bulkActionResultPaymentDto: BulkActionResultPaymentDto = {
      ...bulkActionResultDto,
      sumPaymentAmountMultiplier: totalMultiplierSum,
      programFspConfigurationNames,
    };

    // Create an array of referenceIds to be paid
    const referenceIds = registrationsForPayment.map(
      (registration) => registration.referenceId,
    );

    if (!dryRun && referenceIds.length > 0) {
      await this.checkFspConfigurationsOrThrow(
        programId,
        programFspConfigurationNames,
      );

      const paymentEntity = new PaymentEntity();
      paymentEntity.programId = programId;
      const savedPaymentEntity =
        await this.paymentRepository.save(paymentEntity);
      bulkActionResultPaymentDto.id = savedPaymentEntity.id;

      // TODO: REFACTOR: userId not be passed down, but should be available in a context object; registrationsForPayment.length is redundant, as it is the same as referenceIds.length
      void this.initiatePayment({
        userId,
        programId,
        paymentId: savedPaymentEntity.id,
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
            programId,
            AdditionalActionType.paymentFinished,
          );
        });
    }

    return bulkActionResultPaymentDto;
  }

  private async checkFspConfigurationsOrThrow(
    programId: number,
    programFspConfigurationNames: string[],
  ): Promise<void> {
    const validationResults = await Promise.all(
      programFspConfigurationNames.map((name) =>
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
    programFspConfigurationName: string,
  ): Promise<string[]> {
    const config = await this.programFspConfigurationRepository.findOne({
      where: {
        name: Equal(programFspConfigurationName),
        programId: Equal(programId),
      },
      relations: ['properties'],
    });

    const errorMessages: string[] = [];
    if (!config) {
      errorMessages.push(
        `Missing Program FSP configuration with name ${programFspConfigurationName}`,
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
    programId: number,
    paginateQuery: PaginateQuery,
  ) {
    const chunkSize = 4000;

    return await this.registrationsPaginationService.getRegistrationsChunked(
      programId,
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
    programId,
    paymentId,
    amount,
    referenceIds,
    bulkSize,
  }: {
    userId: number;
    programId: number;
    paymentId: number;
    amount: number;
    referenceIds: string[];
    bulkSize: number;
  }): Promise<number> {
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
        paymentId,
        isRetry: false,
      });

      paymentTransactionResult += result;
    }
    return paymentTransactionResult;
  }

  public async retryPayment(
    userId: number,
    programId: number,
    paymentId: number,
    referenceIdsDto?: ReferenceIdsDto,
  ): Promise<BulkActionResultRetryPaymentDto> {
    await this.checkPaymentInProgressAndThrow(programId);

    await this.getProgramWithFspConfigOrThrow(programId);

    const paPaymentDataList = await this.getPaymentListForRetry(
      programId,
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
      programId,
      AdditionalActionType.paymentStarted,
    );

    void this.payout({
      paPaymentDataList,
      programId,
      paymentId,
      isRetry: true,
    })
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

    const programFspConfigurationNames: string[] = [];
    // This loop is pretty fast: with 131k registrations it takes ~38ms
    for (const registration of paPaymentDataList) {
      if (
        !programFspConfigurationNames.includes(
          registration.programFspConfigurationName,
        )
      ) {
        programFspConfigurationNames.push(
          registration.programFspConfigurationName,
        );
      }
    }

    return {
      totalFilterCount: paPaymentDataList.length,
      applicableCount: paPaymentDataList.length,
      nonApplicableCount: 0,
      programFspConfigurationNames,
    };
  }

  private async getProgramWithFspConfigOrThrow(
    programId: number,
  ): Promise<ProgramEntity> {
    const program = await this.programRepository.findOne({
      where: { id: Equal(programId) },
      relations: ['programFspConfigurations'],
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
    paymentId,
    isRetry = false,
  }: {
    paPaymentDataList: PaPaymentDataDto[];
    programId: number;
    paymentId: number;
    isRetry?: boolean;
  }): Promise<number> {
    // Create an object with an array of PA data for each FSP
    const paLists = this.splitPaListByFsp(paPaymentDataList);

    await this.initiatePaymentPerFsp({
      paLists,
      programId,
      paymentId,
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
    programId,
    paymentId,
    isRetry,
  }: {
    paLists: SplitPaymentListDto;
    programId: number;
    paymentId: number;
    isRetry: boolean;
  }): Promise<void> {
    await Promise.all(
      Object.entries(paLists).map(async ([fsp, paPaymentList]) => {
        if (fsp === Fsps.intersolveVisa) {
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
            paymentId,
            isRetry,
          });
        }

        if (fsp === Fsps.safaricom) {
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
            paymentId,
            isRetry,
          });
        }

        if (fsp === Fsps.airtel) {
          return await this.createAndAddAirtelTransactionJobs({
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
            paymentId,
            isRetry,
          });
        }

        if (fsp === Fsps.nedbank) {
          return await this.createAndAddNedbankTransactionJobs({
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
            paymentId,
            isRetry,
          });
        }

        if (fsp === Fsps.onafriq) {
          return await this.createAndAddOnafriqTransactionJobs({
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
            paymentId,
            isRetry,
          });
        }

        const [paymentService, useWhatsapp] = this.fspNameToServiceMap[fsp];
        return await paymentService.sendPayment(
          paPaymentList,
          programId,
          paymentId,
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
   * @param {number} paymentId - The payment number.
   * @param {boolean} isRetry - Whether this is a retry.
   *
   * @returns {Promise<void>} A promise that resolves when the transaction jobs have been created and added.
   *
   */
  private async createAndAddIntersolveVisaTransactionJobs({
    referenceIdsAndTransactionAmounts: referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
  }: {
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
  }): Promise<void> {
    //  TODO: REFACTOR: This 'ugly' code is now also in registrations.service.reissueCardAndSendMessage. This should be refactored when there's a better way of getting registration data.
    const intersolveVisaAttributes = getFspSettingByNameOrThrow(
      Fsps.intersolveVisa,
    ).attributes;
    const intersolveVisaAttributeNames = intersolveVisaAttributes.map(
      (q) => q.name,
    );
    const dataFieldNames = [
      FspAttributes.phoneNumber,
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
            paymentId,
            referenceId: registrationView.referenceId,
            programFspConfigurationId:
              registrationView.programFspConfigurationId,
            // Use hashmap to lookup transaction amount for this referenceId (with the 4000 chuncksize this takes less than 1ms)
            transactionAmountInMajorUnit: transactionAmountsMap.get(
              registrationView.referenceId,
            )!,
            isRetry,
            bulkSize: referenceIdsTransactionAmounts.length,
            name: registrationView[FspAttributes.fullName]!, // Fullname is a required field if a registration has visa as FSP
            addressStreet: registrationView[FspAttributes.addressStreet],
            addressHouseNumber:
              registrationView[FspAttributes.addressHouseNumber],
            addressHouseNumberAddition:
              registrationView[FspAttributes.addressHouseNumberAddition],
            addressPostalCode:
              registrationView[FspAttributes.addressPostalCode],
            addressCity: registrationView[FspAttributes.addressCity],
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
    paymentId,
    isRetry,
  }: {
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
  }): Promise<void> {
    const safaricomAttributes = getFspSettingByNameOrThrow(
      Fsps.safaricom,
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
          paymentId,
          referenceId: registrationView.referenceId,
          programFspConfigurationId: registrationView.programFspConfigurationId,
          transactionAmount: transactionAmountsMap.get(
            registrationView.referenceId,
          )!,
          isRetry,
          userId,
          bulkSize: referenceIdsTransactionAmounts.length,
          phoneNumber: registrationView.phoneNumber!, // Phonenumber is a required field if a registration has safaricom as FSP
          idNumber: registrationView[FspAttributes.nationalId],
          originatorConversationId: uuid(), // REFACTOR: switch to nedbank/onafriq approach for idempotency key
        };
      });
    await this.transactionQueuesService.addSafaricomTransactionJobs(
      safaricomTransferJobs,
    );
  }

  /**
   * Creates and adds Airtel transaction jobs.
   *
   * This method is responsible for creating transaction jobs for Airtel. It fetches necessary PA data and maps it to a FSP specific DTO.
   * It then adds these jobs to the transaction queue.
   *
   * @returns {Promise<void>} A promise that resolves when the transaction jobs have been created and added.
   *
   */
  private async createAndAddAirtelTransactionJobs({
    referenceIdsAndTransactionAmounts: referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
  }: {
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
  }): Promise<void> {
    // Some code to make linter happy.

    const airtelAttributes = getFspSettingByNameOrThrow(Fsps.airtel).attributes;
    const airtelAttributeNames = airtelAttributes.map((q) => q.name);
    const registrationViews = await this.getRegistrationViews(
      referenceIdsTransactionAmounts,
      airtelAttributeNames,
      programId,
    );

    // Convert the array into a map for increased performace (hashmap lookup)
    const transactionAmountsMap = new Map(
      referenceIdsTransactionAmounts.map((item) => [
        item.referenceId,
        item.transactionAmount,
      ]),
    );

    const airtelTransferJobs: AirtelTransactionJobDto[] = registrationViews.map(
      (registrationView): AirtelTransactionJobDto => {
        return {
          programId,
          paymentId,
          referenceId: registrationView.referenceId,
          programFspConfigurationId: registrationView.programFspConfigurationId,
          transactionAmount: transactionAmountsMap.get(
            registrationView.referenceId,
          )!,
          isRetry,
          userId,
          bulkSize: referenceIdsTransactionAmounts.length,
          phoneNumber: registrationView[FspAttributes.phoneNumber]!,
        };
      },
    );
    await this.transactionQueuesService.addAirtelTransactionJobs(
      airtelTransferJobs,
    );
  }

  /**
   * Creates and adds Nedbank transaction jobs.
   *
   * This method is responsible for creating transaction jobs for Nedbank. It fetches necessary PA data and maps it to a FSP specific DTO.
   * It then adds these jobs to the transaction queue.
   *
   * @returns {Promise<void>} A promise that resolves when the transaction jobs have been created and added.
   *
   */
  private async createAndAddNedbankTransactionJobs({
    referenceIdsAndTransactionAmounts: referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
  }: {
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
  }): Promise<void> {
    const nedbankAttributes = getFspSettingByNameOrThrow(
      Fsps.nedbank,
    ).attributes;
    const nedbankAttributeNames = nedbankAttributes.map((q) => q.name);
    const registrationViews = await this.getRegistrationViews(
      referenceIdsTransactionAmounts,
      nedbankAttributeNames,
      programId,
    );

    // Convert the array into a map for increased performace (hashmap lookup)
    const transactionAmountsMap = new Map(
      referenceIdsTransactionAmounts.map((item) => [
        item.referenceId,
        item.transactionAmount,
      ]),
    );

    const nedbankTransferJobs: NedbankTransactionJobDto[] =
      registrationViews.map((registrationView): NedbankTransactionJobDto => {
        return {
          programId,
          paymentId,
          referenceId: registrationView.referenceId,
          programFspConfigurationId: registrationView.programFspConfigurationId,
          transactionAmount: transactionAmountsMap.get(
            registrationView.referenceId,
          )!,
          isRetry,
          userId,
          bulkSize: referenceIdsTransactionAmounts.length,
          phoneNumber: registrationView[FspAttributes.phoneNumber]!,
        };
      });
    await this.transactionQueuesService.addNedbankTransactionJobs(
      nedbankTransferJobs,
    );
  }

  /**
   * Creates and adds onafriq transaction jobs.
   *
   * This method is responsible for creating transaction jobs for Onafriq. It fetches necessary PA data and maps it to a FSP specific DTO.
   * It then adds these jobs to the transaction queue.
   *
   * @returns {Promise<void>} A promise that resolves when the transaction jobs have been created and added.
   *
   */
  private async createAndAddOnafriqTransactionJobs({
    referenceIdsAndTransactionAmounts: referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
  }: {
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
  }): Promise<void> {
    const onafriqAttributes = getFspSettingByNameOrThrow(
      Fsps.onafriq,
    ).attributes;
    const onafriqAttributeNames = onafriqAttributes.map((q) => q.name);
    const registrationViews = await this.getRegistrationViews(
      referenceIdsTransactionAmounts,
      onafriqAttributeNames,
      programId,
    );

    // Convert the array into a map for increased performace (hashmap lookup)
    const transactionAmountsMap = new Map(
      referenceIdsTransactionAmounts.map((item) => [
        item.referenceId,
        item.transactionAmount,
      ]),
    );

    const onafriqTransactionJobs: OnafriqTransactionJobDto[] =
      registrationViews.map((registrationView): OnafriqTransactionJobDto => {
        return {
          programId,
          paymentId,
          referenceId: registrationView.referenceId,
          programFspConfigurationId: registrationView.programFspConfigurationId,
          transactionAmount: transactionAmountsMap.get(
            registrationView.referenceId,
          )!,
          isRetry,
          userId,
          bulkSize: referenceIdsTransactionAmounts.length,
          phoneNumber: registrationView.phoneNumber!,
          firstName: registrationView[FspAttributes.firstName],
          lastName: registrationView[FspAttributes.lastName],
        };
      });
    await this.transactionQueuesService.addOnafriqTransactionJobs(
      onafriqTransactionJobs,
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

  private getPaymentRegistrationsQuery(
    programId: number,
  ): ScopedQueryBuilder<RegistrationEntity> {
    const q = this.registrationScopedRepository
      .createQueryBuilder('registration')
      .select('"referenceId"')
      .addSelect('registration.id as id')
      .addSelect('"fspConfig"."fspName" as "fspName"')
      .addSelect('"fspConfig"."id" as "programFspConfigurationId"')
      .andWhere('registration."programId" = :programId', { programId })
      .leftJoin('registration.programFspConfiguration', 'fspConfig');
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
    paymentId: number,
    userId: number,
    referenceIds?: string[],
  ): Promise<PaPaymentRetryDataDto[]> {
    let q = this.getPaymentRegistrationsQuery(programId);
    q = this.failedTransactionForRegistrationAndPayment(q, paymentId);

    q.addSelect('"fspConfig"."name" as "programFspConfigurationName"');

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
          programId,
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
        programFspConfigurationId: row.programFspConfigurationId,
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

  public async getFspInstructions(
    programId: number,
    paymentId: number,
    userId: number,
  ): Promise<FspInstructions[]> {
    const transactions = await this.transactionsService.getLastTransactions({
      programId,
      paymentId,
    });

    const programFspConfigEntitiesWithFspInstruction =
      await this.programFspConfigurationRepository.find({
        where: {
          programId: Equal(programId),
          fspName: In(this.getFspNamesThatRequireInstructions()),
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

    /// Seprate transactionsWithFspInstruction based on their programFspConfigurationName
    const allFspInstructions: FspInstructions[] = [];
    for (const fspConfigEntity of programFspConfigEntitiesWithFspInstruction) {
      const fspInstructions =
        await this.getFspInstructionsPerProgramFspConfiguration({
          programId,
          paymentId,
          transactions: transactionsWithFspInstruction.filter(
            (t) => t.programFspConfigurationName === fspConfigEntity.name,
          ),
          programFspConfigurationName: fspConfigEntity.name,
          programFspConfigurationId: fspConfigEntity.id,
          fspName: fspConfigEntity.fspName,
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
    return FSP_SETTINGS.filter((fsp) =>
      [FspIntegrationType.csv].includes(fsp.integrationType),
    ).map((fsp) => fsp.name);
  }

  private filterTransactionsWithFspInstructionBasedOnStatus(
    transactions: TransactionReturnDto[],
    programFspConfigEntitiesWithFspInstruction: ProgramFspConfigurationEntity[],
  ): TransactionReturnDto[] {
    const programFspConfigNamesThatRequireInstructions =
      programFspConfigEntitiesWithFspInstruction.map((c) => c.name);

    const transactionsWithFspInstruction = transactions.filter((t) =>
      programFspConfigNamesThatRequireInstructions.includes(
        t.programFspConfigurationName,
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
    paymentId,
    programFspConfigurationName,
    programFspConfigurationId,
    fspName,
  }: {
    transactions: TransactionReturnDto[];
    programId: number;
    paymentId: number;
    programFspConfigurationName: string;
    programFspConfigurationId: number;
    fspName: Fsps;
  }): Promise<FspInstructions> {
    if (fspName === Fsps.excel) {
      return {
        data: await this.excelService.getFspInstructions({
          transactions,
          programId,
          paymentId,
          programFspConfigurationId,
        }),
        fileNamePrefix: programFspConfigurationName,
      };
    }
    // Is this the best way to prevent a typeerror on the return type?
    throw new Error(`FspName ${fspName} not supported in fsp export`);
  }

  public async geTransactionsByPaymentId({
    programId,
    paymentId,
  }: {
    programId: number;
    paymentId: number;
  }): Promise<GetTransactionResponseDto[]> {
    // For in the portal we always want the name of the registration, so we need to select it
    const select = [DefaultRegistrationDataAttributeNames.name];

    const transactions = await this.getTransactions({
      programId,
      paymentId,
      select,
    });

    return transactions;
  }

  public async exportTransactionsUsingDateFilter({
    programId,
    fromDateString,
    toDateString,
    paymentId,
  }: {
    programId: number;
    fromDateString?: string;
    toDateString?: string;
    paymentId?: number;
  }): Promise<FileDto> {
    // Convert string dates to Date objects
    const fromDate = fromDateString ? new Date(fromDateString) : undefined;
    const toDate = toDateString ? new Date(toDateString) : undefined;

    const fileName =
      this.paymentsHelperService.createTransactionsExportFilename(
        programId,
        fromDate,
        toDate,
      );

    const select =
      await this.paymentsHelperService.getSelectForExport(programId);
    const transactions = await this.getTransactions({
      programId,
      select,
      fromDate,
      toDate,
      paymentId,
    });

    const dropdownAttributes =
      await this.programRegistrationAttributeRepository.getDropdownAttributes({
        programId,
        select,
      });

    return {
      data: RegistrationViewsMapper.replaceDropdownValuesWithEnglishLabel({
        rows: transactions,
        attributes: dropdownAttributes,
      }),
      fileName,
    };
  }

  private async getTransactions({
    programId,
    select,
    paymentId,
    fromDate,
    toDate,
  }: {
    programId: number;
    select: string[];
    paymentId?: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<
    (GetTransactionResponseDto & // This is the type returned by the transaction repository
      Record<string, unknown>)[] // These are the dynamic fsp specific fields & the dynamic configured fields from the registration as set in 'export' of program registration attributes
  > {
    const fspSpecificJoinFields =
      await this.paymentsHelperService.getFspSpecificJoinFields(programId);

    const transactions = await this.transactionScopedRepository.getTransactions(
      {
        programId,
        paymentId,
        fromDate,
        toDate,
        fspSpecificJoinFields,
      },
    );

    if (!transactions || transactions.length === 0) {
      return [];
    }

    const referenceIds = transactions.map((t) => t.registrationReferenceId);

    select.push(GenericRegistrationAttributes.referenceId);
    const registrationViews =
      (await this.registrationPaginationService.getRegistrationViewsChunkedByReferenceIds(
        { programId, referenceIds, select },
      )) as Omit<MappedPaginatedRegistrationDto, 'status'>[];

    // Create a map for faster lookups
    const registrationViewMap = new Map(
      registrationViews.map((item) => [item.referenceId, item]),
    );

    const result = transactions.map((transaction) => {
      const registrationView = registrationViewMap.get(
        transaction.registrationReferenceId,
      );

      if (!registrationView) {
        return { ...transaction };
      }
      // Destructure 'name' as 'registrationName', and spread the rest
      const { name, referenceId: _referenceId, ...rest } = registrationView;
      return {
        ...transaction,
        registrationName: name,
        ...rest,
      };
    });

    return result;
  }
}
